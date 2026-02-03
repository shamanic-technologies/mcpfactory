import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { apolloPeopleSearches, apolloPeopleEnrichments } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { searchPeople, ApolloSearchParams, ApolloPerson } from "../lib/apollo-client.js";
import { getByokKey } from "../lib/keys-client.js";
import { ensureOrganization, createRun, updateRun, addCosts } from "@mcpfactory/runs-client";

const router = Router();

/**
 * POST /search - Search for people via Apollo
 * runId is optional - if provided, links to a runs-service run (campaign workflow)
 */
router.post("/search", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { runId, ...searchParams } = req.body;

    // Get Apollo API key from keys-service
    const apolloApiKey = await getByokKey(req.clerkOrgId!, "apollo");

    // Call Apollo API
    const apolloParams: ApolloSearchParams = {
      person_titles: searchParams.personTitles,
      q_organization_keyword_tags: searchParams.qOrganizationKeywordTags,
      organization_locations: searchParams.organizationLocations,
      organization_num_employees_ranges: searchParams.organizationNumEmployeesRanges,
      q_organization_industry_tag_ids: searchParams.qOrganizationIndustryTagIds,
      q_keywords: searchParams.qKeywords,
      page: searchParams.page || 1,
      per_page: searchParams.perPage || 25,
    };

    // Create a child run in runs-service for this search
    let searchRunId: string | undefined;
    if (runId) {
      try {
        const runsOrgId = await ensureOrganization(req.clerkOrgId!);
        const searchRun = await createRun({
          organizationId: runsOrgId,
          serviceName: "apollo-service",
          taskName: "people-search",
          parentRunId: runId,
        });
        searchRunId = searchRun.id;
      } catch (err) {
        console.warn("[apollo] Failed to create search run in runs-service:", err);
      }
    }

    const result = await searchPeople(apolloApiKey, apolloParams);

    // Get total entries (new API format has it at root level)
    const totalEntries = result.total_entries ?? result.pagination?.total_entries ?? 0;

    // Only store records if runId is provided (campaign workflow)
    let searchId: string | null = null;
    if (runId) {
      // Store search record
      const [search] = await db
        .insert(apolloPeopleSearches)
        .values({
          orgId: req.orgId!,
          runId,
          requestParams: apolloParams,
          peopleCount: result.people.length,
          totalEntries,
          responseRaw: result,
        })
        .returning();

      searchId = search.id;

      // Store enrichment records and track each in runs-service
      const runsOrgId = await ensureOrganization(req.clerkOrgId!);

      for (const person of result.people as ApolloPerson[]) {
        const [enrichment] = await db.insert(apolloPeopleEnrichments).values({
          orgId: req.orgId!,
          runId,
          searchId: search.id,
          apolloPersonId: person.id,
          firstName: person.first_name,
          lastName: person.last_name,
          email: person.email,
          emailStatus: person.email_status,
          title: person.title,
          linkedinUrl: person.linkedin_url,
          organizationName: person.organization?.name,
          organizationDomain: person.organization?.primary_domain,
          organizationIndustry: person.organization?.industry,
          organizationSize: person.organization?.estimated_num_employees?.toString(),
          organizationRevenueUsd: person.organization?.annual_revenue?.toString(),
          responseRaw: person,
        }).returning();

        // Create grandchild run + post costs in runs-service
        if (searchRunId) {
          try {
            const enrichRun = await createRun({
              organizationId: runsOrgId,
              serviceName: "apollo-service",
              taskName: "enrichment",
              parentRunId: searchRunId,
            });

            // Link enrichment run to record IMMEDIATELY so per-item cost
            // lookups work even if addCosts/updateRun fail below
            await db.update(apolloPeopleEnrichments)
              .set({ enrichmentRunId: enrichRun.id })
              .where(eq(apolloPeopleEnrichments.id, enrichment.id));

            await addCosts(enrichRun.id, [{ costName: "apollo-enrichment-credit", quantity: 1 }]);
            await updateRun(enrichRun.id, "completed");
          } catch (err) {
            console.error("[apollo] COST TRACKING FAILED for enrichment — costs will be missing from campaign totals.", {
              runId,
              searchRunId,
              personId: person.id,
              costName: "apollo-enrichment-credit",
              error: err instanceof Error ? err.message : err,
            });
          }
        }
      }

      // Mark search run as completed
      if (searchRunId) {
        try {
          await addCosts(searchRunId, [{ costName: "apollo-search-credit", quantity: 1 }]);
          await updateRun(searchRunId, "completed");
        } catch (err) {
          console.error("[apollo] COST TRACKING FAILED for search — costs will be missing from campaign totals.", {
            runId,
            searchRunId,
            costName: "apollo-search-credit",
            error: err instanceof Error ? err.message : err,
          });
        }
      }
    }

    // Transform to camelCase for worker consumption
    const transformedPeople = result.people.map((person: ApolloPerson) => ({
      id: person.id,
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email,
      emailStatus: person.email_status,
      title: person.title,
      linkedinUrl: person.linkedin_url,
      organizationName: person.organization?.name,
      organizationDomain: person.organization?.primary_domain,
      organizationIndustry: person.organization?.industry,
      organizationSize: person.organization?.estimated_num_employees?.toString(),
    }));

    res.json({
      searchId,
      peopleCount: result.people.length,
      totalEntries,
      people: transformedPeople,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

/**
 * GET /searches/:runId - Get all searches for a run
 */
router.get("/searches/:runId", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { runId } = req.params;

    const searches = await db.query.apolloPeopleSearches.findMany({
      where: (searches, { eq, and }) =>
        and(
          eq(searches.runId, runId),
          eq(searches.orgId, req.orgId!)
        ),
    });

    res.json({ searches });
  } catch (error) {
    console.error("Get searches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /enrichments/:runId - Get all enrichments for a run
 */
router.get("/enrichments/:runId", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { runId } = req.params;

    const enrichments = await db.query.apolloPeopleEnrichments.findMany({
      where: (enrichments, { eq, and }) =>
        and(
          eq(enrichments.runId, runId),
          eq(enrichments.orgId, req.orgId!)
        ),
    });

    res.json({ enrichments });
  } catch (error) {
    console.error("Get enrichments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /stats - Get aggregated stats for multiple run IDs
 * Body: { runIds: string[] }
 */
router.post("/stats", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { runIds } = req.body as { runIds: string[] };

    if (!runIds || !Array.isArray(runIds)) {
      return res.status(400).json({ error: "runIds array required" });
    }

    if (runIds.length === 0) {
      return res.json({ stats: { leadsFound: 0, searchesCount: 0 } });
    }

    // Count enrichments (leads found)
    const enrichments = await db.query.apolloPeopleEnrichments.findMany({
      where: (e, { and, eq, inArray }) =>
        and(
          inArray(e.runId, runIds),
          eq(e.orgId, req.orgId!)
        ),
      columns: { id: true },
    });

    // Count searches
    const searches = await db.query.apolloPeopleSearches.findMany({
      where: (s, { and, eq, inArray }) =>
        and(
          inArray(s.runId, runIds),
          eq(s.orgId, req.orgId!)
        ),
      columns: { id: true, peopleCount: true },
    });

    const totalPeopleFromSearches = searches.reduce((sum, s) => sum + (s.peopleCount || 0), 0);

    res.json({
      stats: {
        leadsFound: enrichments.length,
        searchesCount: searches.length,
        totalPeopleFromSearches,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
