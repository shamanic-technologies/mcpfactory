import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { replies, replyQualifications, forwards } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { qualifyReply } from "../lib/qualify-reply.js";
import { getByokKey } from "../lib/keys-client.js";

const router = Router();

/**
 * POST /replies - Record a new reply (from Postmark webhook)
 */
router.post("/replies", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      emailId,
      campaignRunId,
      fromEmail,
      toEmail,
      subject,
      bodyText,
      bodyHtml,
      postmarkMessageId,
      receivedAt,
      webhookRaw,
    } = req.body;

    if (!emailId || !campaignRunId || !fromEmail || !toEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [reply] = await db
      .insert(replies)
      .values({
        orgId: req.orgId!,
        emailId,
        campaignRunId,
        fromEmail,
        toEmail,
        subject,
        bodyText,
        bodyHtml,
        postmarkMessageId,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        webhookRaw,
      })
      .returning();

    res.status(201).json({ reply });
  } catch (error) {
    console.error("Create reply error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /replies/:id/qualify - Qualify a reply using AI
 */
router.post("/replies/:id/qualify", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Get the reply
    const reply = await db.query.replies.findFirst({
      where: and(
        eq(replies.id, id),
        eq(replies.orgId, req.orgId!)
      ),
    });

    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }

    // Get Anthropic API key
    const anthropicApiKey = await getByokKey(req.clerkOrgId!, "anthropic");

    // Qualify the reply
    const result = await qualifyReply(
      anthropicApiKey,
      reply.bodyText || "",
      reply.subject || undefined
    );

    // Store qualification
    const [qualification] = await db
      .insert(replyQualifications)
      .values({
        replyId: reply.id,
        classification: result.classification,
        confidence: result.confidence.toFixed(4),
        reasoning: result.reasoning,
        model: "claude-3-haiku-20240307",
        costUsd: result.costUsd.toFixed(6),
        responseRaw: result.responseRaw,
      })
      .returning();

    res.json({
      qualification: {
        id: qualification.id,
        classification: result.classification,
        confidence: result.confidence,
        reasoning: result.reasoning,
      },
    });
  } catch (error) {
    console.error("Qualify reply error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

/**
 * POST /replies/:id/forward - Forward a reply to the client
 */
router.post("/replies/:id/forward", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { forwardTo } = req.body;

    if (!forwardTo) {
      return res.status(400).json({ error: "forwardTo email required" });
    }

    // Get the reply
    const reply = await db.query.replies.findFirst({
      where: and(
        eq(replies.id, id),
        eq(replies.orgId, req.orgId!)
      ),
    });

    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }

    // TODO: Call Postmark service to actually send the forward email

    // Record the forward
    const [forward] = await db
      .insert(forwards)
      .values({
        replyId: reply.id,
        orgId: req.orgId!,
        forwardedTo: forwardTo,
        forwardedAt: new Date(),
      })
      .returning();

    res.json({ forward });
  } catch (error) {
    console.error("Forward reply error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /replies - List replies for org
 */
router.get("/replies", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignRunId } = req.query;

    const conditions = [eq(replies.orgId, req.orgId!)];
    if (campaignRunId && typeof campaignRunId === "string") {
      conditions.push(eq(replies.campaignRunId, campaignRunId));
    }

    const orgReplies = await db.query.replies.findMany({
      where: and(...conditions),
      orderBy: (replies, { desc }) => [desc(replies.receivedAt)],
    });

    res.json({ replies: orgReplies });
  } catch (error) {
    console.error("List replies error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /replies/:id - Get a specific reply with qualification
 */
router.get("/replies/:id", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const reply = await db.query.replies.findFirst({
      where: and(
        eq(replies.id, id),
        eq(replies.orgId, req.orgId!)
      ),
    });

    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }

    const qualification = await db.query.replyQualifications.findFirst({
      where: eq(replyQualifications.replyId, reply.id),
    });

    const forward = await db.query.forwards.findFirst({
      where: eq(forwards.replyId, reply.id),
    });

    res.json({
      reply,
      qualification,
      forward,
    });
  } catch (error) {
    console.error("Get reply error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
