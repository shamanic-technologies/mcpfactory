import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.js";
import { callExternalService, externalServices } from "../lib/service-client.js";

const router = Router();

/**
 * POST /v1/qualify
 * Qualify an email reply using AI
 */
router.post("/qualify", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      sourceService = "api",
      sourceOrgId,
      sourceRefId,
      fromEmail,
      toEmail,
      subject,
      bodyText,
      bodyHtml,
      byokApiKey,
    } = req.body;

    // Use orgId from auth if not provided
    const orgId = sourceOrgId || req.orgId;

    if (!fromEmail || !toEmail) {
      return res.status(400).json({ error: "fromEmail and toEmail are required" });
    }

    if (!bodyText && !bodyHtml) {
      return res.status(400).json({ error: "bodyText or bodyHtml is required" });
    }

    const result = await callExternalService(
      externalServices.replyQualification,
      "/qualify",
      {
        method: "POST",
        body: {
          sourceService,
          sourceOrgId: orgId,
          sourceRefId,
          fromEmail,
          toEmail,
          subject,
          bodyText,
          bodyHtml,
          byokApiKey,
        },
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Qualify error:", error);
    res.status(500).json({ error: error.message || "Failed to qualify reply" });
  }
});

export default router;
