import { Router } from "express";
import { db } from "../db/index.js";
import { apolloPeopleSearches, apolloPeopleEnrichments } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { searchPeople, ApolloSearchParams, ApolloPerson } from "../lib/apollo-client.js";
import { getByokKey } from "../lib/keys-client.js";

const router = Router();

/**
 * POST /search - Search for people via Apollo
 */
router.post("/search", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignRunId, ...searchParams } = req.body;

    if (!campaignRunId) {
      return res.status(400).json({ error: "campaignRunId required" });
    }

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

    const result = await searchPeople(apolloApiKey, apolloParams);

    // Store search record
    const [search] = await db
      .insert(apolloPeopleSearches)
      .values({
        orgId: req.orgId!,
        campaignRunId,
        requestParams: apolloParams,
        peopleCount: result.people.length,
        totalEntries: result.pagination.total_entries,
        costUsd: "0", // Apollo search is usually free
        responseRaw: result,
      })
      .returning();

    // Store enrichment records for each person
    const enrichmentPromises = result.people.map((person: ApolloPerson) =>
      db.insert(apolloPeopleEnrichments).values({
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
        costUsd: "0",
        responseRaw: person,
      })
    );

    await Promise.all(enrichmentPromises);

    res.json({
      searchId: search.id,
      peopleCount: result.people.length,
      totalEntries: result.pagination.total_entries,
      people: result.people,
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

export default router;
