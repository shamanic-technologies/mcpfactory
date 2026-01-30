import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { emailGenerations } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { generateEmail, GenerateEmailParams } from "../lib/anthropic-client.js";
import { getByokKey } from "../lib/keys-client.js";

const router = Router();

/**
 * POST /generate - Generate an email for a lead
 */
router.post("/generate", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      campaignRunId,
      apolloEnrichmentId,
      leadFirstName,
      leadLastName,
      leadTitle,
      leadCompany,
      leadIndustry,
      clientCompanyName,
      clientCompanyDescription,
      clientValue,
    } = req.body;

    if (!campaignRunId || !apolloEnrichmentId) {
      return res.status(400).json({ error: "campaignRunId and apolloEnrichmentId required" });
    }

    if (!leadFirstName || !leadCompany) {
      return res.status(400).json({ error: "leadFirstName and leadCompany required" });
    }

    if (!clientCompanyName || !clientCompanyDescription) {
      return res.status(400).json({ error: "clientCompanyName and clientCompanyDescription required" });
    }

    // Get Anthropic API key from keys-service
    const anthropicApiKey = await getByokKey(req.clerkOrgId!, "anthropic");

    // Generate email
    const params: GenerateEmailParams = {
      leadFirstName,
      leadLastName,
      leadTitle,
      leadCompany,
      leadIndustry,
      clientCompanyName,
      clientCompanyDescription,
      clientValue,
    };

    const result = await generateEmail(anthropicApiKey, params);

    // Store in database
    const [generation] = await db
      .insert(emailGenerations)
      .values({
        orgId: req.orgId!,
        campaignRunId,
        apolloEnrichmentId,
        leadFirstName,
        leadLastName,
        leadCompany,
        leadTitle,
        clientCompanyName,
        clientCompanyDescription,
        subject: result.subject,
        bodyHtml: result.bodyHtml,
        bodyText: result.bodyText,
        model: "claude-3-haiku-20240307",
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd: result.costUsd.toFixed(6),
        promptRaw: result.promptRaw,
        responseRaw: result.responseRaw,
      })
      .returning();

    res.json({
      id: generation.id,
      subject: result.subject,
      bodyHtml: result.bodyHtml,
      bodyText: result.bodyText,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
      costUsd: result.costUsd,
    });
  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

/**
 * GET /generations/:campaignRunId - Get all generations for a campaign run
 */
router.get("/generations/:campaignRunId", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignRunId } = req.params;

    const generations = await db.query.emailGenerations.findMany({
      where: (gens, { eq, and }) =>
        and(
          eq(gens.campaignRunId, campaignRunId),
          eq(gens.orgId, req.orgId!)
        ),
    });

    res.json({ generations });
  } catch (error) {
    console.error("Get generations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /generations/by-enrichment/:apolloEnrichmentId - Get generation by enrichment ID
 */
router.get("/generations/by-enrichment/:apolloEnrichmentId", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { apolloEnrichmentId } = req.params;

    const generation = await db.query.emailGenerations.findFirst({
      where: (gens, { eq, and }) =>
        and(
          eq(gens.apolloEnrichmentId, apolloEnrichmentId),
          eq(gens.orgId, req.orgId!)
        ),
    });

    if (!generation) {
      return res.status(404).json({ error: "Generation not found" });
    }

    res.json({ generation });
  } catch (error) {
    console.error("Get generation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
