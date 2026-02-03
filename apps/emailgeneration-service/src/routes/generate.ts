import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { emailGenerations } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { generateEmail, GenerateEmailParams } from "../lib/anthropic-client.js";
import { getByokKey } from "../lib/keys-client.js";
import { ensureOrganization, createRun, updateRun, addCosts } from "@mcpfactory/runs-client";

const router = Router();

/**
 * POST /generate - Generate an email for a lead
 */
router.post("/generate", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      runId,
      apolloEnrichmentId,
      // Lead person info
      leadFirstName,
      leadLastName,
      leadTitle,
      leadEmail,
      leadLinkedinUrl,
      // Lead company info
      leadCompanyName,
      leadCompanyDomain,
      leadCompanyIndustry,
      leadCompanySize,
      leadCompanyRevenueUsd,
      // Client (our company) info
      clientCompanyName,
      clientBrandUrl,
      clientCompanyOverview,
      clientValueProposition,
      clientTargetAudience,
      clientCustomerPainPoints,
      clientKeyFeatures,
      clientProductDifferentiators,
      clientCompetitors,
      clientSocialProof,
      clientCallToAction,
      clientAdditionalContext,
    } = req.body;

    if (!runId || !apolloEnrichmentId) {
      return res.status(400).json({ error: "runId and apolloEnrichmentId are required" });
    }

    if (!leadFirstName || !leadCompanyName) {
      return res.status(400).json({ error: "leadFirstName and leadCompanyName required" });
    }

    if (!clientCompanyName) {
      return res.status(400).json({ error: "clientCompanyName required" });
    }

    // Get Anthropic API key from keys-service
    const anthropicApiKey = await getByokKey(req.clerkOrgId!, "anthropic");

    // Generate email with all available data
    const params: GenerateEmailParams = {
      // Lead person info
      leadFirstName,
      leadLastName,
      leadTitle,
      leadEmail,
      leadLinkedinUrl,
      // Lead company info
      leadCompanyName,
      leadCompanyDomain,
      leadCompanyIndustry,
      leadCompanySize,
      leadCompanyRevenueUsd,
      // Client (our company) info
      clientCompanyName,
      clientBrandUrl,
      clientCompanyOverview,
      clientValueProposition,
      clientTargetAudience,
      clientCustomerPainPoints,
      clientKeyFeatures,
      clientProductDifferentiators,
      clientCompetitors,
      clientSocialProof,
      clientCallToAction,
      clientAdditionalContext,
    };

    const result = await generateEmail(anthropicApiKey, params);

    // Store in database
    const [generation] = await db
      .insert(emailGenerations)
      .values({
        orgId: req.orgId!,
        runId,
        apolloEnrichmentId,
        leadFirstName,
        leadLastName,
        leadCompany: leadCompanyName,
        leadTitle,
        clientCompanyName,
        clientCompanyDescription: clientValueProposition || clientCompanyOverview || "",
        subject: result.subject,
        bodyHtml: result.bodyHtml,
        bodyText: result.bodyText,
        model: "claude-opus-4-5",
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        promptRaw: result.promptRaw,
        responseRaw: result.responseRaw,
      })
      .returning();

    // Track run + costs in runs-service
    try {
      const runsOrgId = await ensureOrganization(req.clerkOrgId!);
      const genRun = await createRun({
        organizationId: runsOrgId,
        serviceName: "emailgeneration-service",
        taskName: "single-generation",
        parentRunId: runId,
      });

      const costItems = [];
      if (result.tokensInput) {
        costItems.push({ costName: "anthropic-opus-4.5-tokens-input", quantity: result.tokensInput });
      }
      if (result.tokensOutput) {
        costItems.push({ costName: "anthropic-opus-4.5-tokens-output", quantity: result.tokensOutput });
      }
      if (costItems.length > 0) {
        await addCosts(genRun.id, costItems);
      }
      await updateRun(genRun.id, "completed");

      // Link generation run to email record for cost lookups
      await db.update(emailGenerations)
        .set({ generationRunId: genRun.id })
        .where(eq(emailGenerations.id, generation.id));
    } catch (err) {
      console.error("[emailgen] COST TRACKING FAILED — costs will be missing from campaign totals.", {
        runId,
        apolloEnrichmentId,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costNames: ["anthropic-opus-4.5-tokens-input", "anthropic-opus-4.5-tokens-output"],
        error: err instanceof Error ? err.message : err,
      });
    }

    res.json({
      id: generation.id,
      subject: result.subject,
      bodyHtml: result.bodyHtml,
      bodyText: result.bodyText,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
    });
  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

/**
 * GET /generations/:runId - Get all generations for a run
 */
router.get("/generations/:runId", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { runId } = req.params;

    const generations = await db.query.emailGenerations.findMany({
      where: (gens, { eq, and }) =>
        and(
          eq(gens.runId, runId),
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
      return res.json({ stats: { emailsGenerated: 0 } });
    }

    // Count email generations
    const generations = await db.query.emailGenerations.findMany({
      where: (g, { and, eq, inArray }) =>
        and(
          inArray(g.runId, runIds),
          eq(g.orgId, req.orgId!)
        ),
      columns: { id: true },
    });

    res.json({
      stats: {
        emailsGenerated: generations.length,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
