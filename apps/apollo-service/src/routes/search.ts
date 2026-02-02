import { Router } from "express";
import { db } from "../db/index.js";
import { apolloPeopleSearches, apolloPeopleEnrichments } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { searchPeople, ApolloSearchParams, ApolloPerson } from "../lib/apollo-client.js";
import { getByokKey } from "../lib/keys-client.js";
import { ensureOrganization, createRun, updateRun, addCosts } from "@mcpfactory/runs-client";

const router = Router();

/**
 * POST /search - Search for people via Apollo
 * campaignRunId is optional - if not provided, search is ad-hoc (MCP usage)
 */
router.post("/search", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignRunId, ...searchParams } = req.body;

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
    if (campaignRunId) {
      try {
        const runsOrgId = await ensureOrganization(req.clerkOrgId!);
        const searchRun = await createRun({
          organizationId: runsOrgId,
          serviceName: "apollo-service",
          taskName: "people-search",
          parentRunId: campaignRunId,
        });
        searchRunId = searchRun.id;
      } catch (err) {
        console.warn("[apollo] Failed to create search run in runs-service:", err);
      }
    }

    const result = await searchPeople(apolloApiKey, apolloParams);

    // Get total entries (new API format has it at root level)
    const totalEntries = result.total_entries ?? result.pagination?.total_entries ?? 0;

    // Only store records if campaignRunId is provided (campaign workflow)
    let searchId: string | null = null;
    if (campaignRunId) {
      // Store search record
      const [search] = await db
        .insert(apolloPeopleSearches)
        .values({
          orgId: req.orgId!,
          campaignRunId,
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
        await db.insert(apolloPeopleEnrichments).values({
          orgId: req.orgId!,
          campaignRunId,
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
        });

        // Create grandchild run + post costs in runs-service
        if (searchRunId) {
          try {
            const enrichRun = await createRun({
              organizationId: runsOrgId,
              serviceName: "apollo-service",
              taskName: "enrichment",
              parentRunId: searchRunId,
            });
            await addCosts(enrichRun.id, [{ costName: "apollo-enrichment-credit", quantity: 1 }]);
            await updateRun(enrichRun.id, "completed");
          } catch (err) {
            console.warn("[apollo] Failed to track enrichment run:", err);
          }
        }
      }

      // Mark search run as completed
      if (searchRunId) {
        try {
          await addCosts(searchRunId, [{ costName: "apollo-search-credit", quantity: 1 }]);
          await updateRun(searchRunId, "completed");
        } catch (err) {
          console.warn("[apollo] Failed to complete search run:", err);
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
 * GET /searches/:campaignRunId - Get all searches for a campaign run
 */
router.get("/searches/:campaignRunId", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignRunId } = req.params;

    const searches = await db.query.apolloPeopleSearches.findMany({
      where: (searches, { eq, and }) =>
        and(
          eq(searches.campaignRunId, campaignRunId),
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
 * GET /enrichments/:campaignRunId - Get all enrichments for a campaign run
 */
router.get("/enrichments/:campaignRunId", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignRunId } = req.params;

    const enrichments = await db.query.apolloPeopleEnrichments.findMany({
      where: (enrichments, { eq, and }) =>
        and(
          eq(enrichments.campaignRunId, campaignRunId),
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
 * POST /stats - Get aggregated stats for multiple campaign run IDs
 * Body: { campaignRunIds: string[] }
 */
router.post("/stats", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignRunIds } = req.body as { campaignRunIds: string[] };

    if (!campaignRunIds || !Array.isArray(campaignRunIds)) {
      return res.status(400).json({ error: "campaignRunIds array required" });
    }

    if (campaignRunIds.length === 0) {
      return res.json({ stats: { leadsFound: 0, searchesCount: 0 } });
    }

    // Count enrichments (leads found)
    const enrichments = await db.query.apolloPeopleEnrichments.findMany({
      where: (e, { and, eq, inArray }) =>
        and(
          inArray(e.campaignRunId, campaignRunIds),
          eq(e.orgId, req.orgId!)
        ),
      columns: { id: true },
    });

    // Count searches
    const searches = await db.query.apolloPeopleSearches.findMany({
      where: (s, { and, eq, inArray }) =>
        and(
          inArray(s.campaignRunId, campaignRunIds),
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
