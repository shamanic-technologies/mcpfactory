import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callService, services } from "../lib/service-client.js";
import { buildInternalHeaders } from "../lib/internal-headers.js";

const router = Router();

/**
 * POST /v1/leads/search
 * Search for leads using Apollo
 */
router.post("/leads/search", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      person_titles,
      organization_locations,
      organization_industries,
      organization_num_employees_ranges,
      per_page = 10,
    } = req.body;

    if (!person_titles || !Array.isArray(person_titles) || person_titles.length === 0) {
      return res.status(400).json({ error: "person_titles array is required" });
    }

    // Call apollo-service
    const result = await callService(
      services.apollo,
      "/search",
      {
        method: "POST",
        headers: buildInternalHeaders(req),
        body: {
          personTitles: person_titles,
          organizationLocations: organization_locations,
          qOrganizationIndustryTagIds: organization_industries,
          organizationNumEmployeesRanges: organization_num_employees_ranges,
          perPage: Math.min(per_page, 100), // Cap at 100
        },
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Lead search error:", error);
    res.status(500).json({ error: error.message || "Failed to search leads" });
  }
});

/**
 * POST /v1/leads/enrich
 * Enrich a lead with additional information
 */
router.post("/leads/enrich", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { email, linkedin_url } = req.body;

    if (!email && !linkedin_url) {
      return res.status(400).json({ error: "email or linkedin_url is required" });
    }

    const result = await callService(
      services.apollo,
      "/enrich",
      {
        method: "POST",
        headers: buildInternalHeaders(req),
        body: {
          email,
          linkedinUrl: linkedin_url,
        },
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Lead enrich error:", error);
    res.status(500).json({ error: error.message || "Failed to enrich lead" });
  }
});

export default router;
