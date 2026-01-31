import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const REPLY_QUALIFICATION_URL = process.env.REPLY_QUALIFICATION_SERVICE_URL || "http://localhost:3006";
const REPLY_QUALIFICATION_API_KEY = process.env.REPLY_QUALIFICATION_SERVICE_API_KEY;

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

    // Call reply-qualification-service
    const response = await fetch(`${REPLY_QUALIFICATION_URL}/qualify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": REPLY_QUALIFICATION_API_KEY || "",
      },
      body: JSON.stringify({
        sourceService,
        sourceOrgId: orgId,
        sourceRefId,
        fromEmail,
        toEmail,
        subject,
        bodyText,
        bodyHtml,
        byokApiKey,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Qualification failed" }));
      return res.status(response.status).json(error);
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("Qualify error:", error);
    res.status(500).json({ error: error.message || "Failed to qualify reply" });
  }
});

export default router;
