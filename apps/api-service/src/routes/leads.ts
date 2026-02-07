import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callExternalService, externalServices } from "../lib/service-client.js";

const router = Router();

/**
 * POST /v1/leads/search
 * Search for leads via lead-service
 */
router.post("/leads/search", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  // #swagger.tags = ['Leads']
  // #swagger.summary = 'Search for leads'
  // #swagger.description = 'Search for leads using Apollo-compatible filters (titles, locations, industries, company size)'
  // #swagger.security = [{ "bearerAuth": [] }, { "apiKey": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["person_titles"],
          properties: {
            person_titles: { type: "array", items: { type: "string" }, description: "Job titles to search for" },
            organization_locations: { type: "array", items: { type: "string" }, description: "Company locations filter" },
            organization_industries: { type: "array", items: { type: "string" }, description: "Industry tag IDs filter" },
            organization_num_employees_ranges: { type: "array", items: { type: "string" }, description: "Employee count ranges" },
            per_page: { type: "integer", description: "Results per page (max 100)", default: 10 }
          }
        }
      }
    }
  } */
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

    const result = await callExternalService(
      externalServices.lead,
      "/search",
      {
        method: "POST",
        headers: { "x-clerk-org-id": req.orgId! },
        body: {
          personTitles: person_titles,
          organizationLocations: organization_locations,
          qOrganizationIndustryTagIds: organization_industries,
          organizationNumEmployeesRanges: organization_num_employees_ranges,
          perPage: Math.min(per_page, 100),
        },
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Lead search error:", error);
    res.status(500).json({ error: error.message || "Failed to search leads" });
  }
});

// POST /v1/leads/enrich removed - no consumers

export default router;
