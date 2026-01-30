import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-3-haiku-20240307";

// Pricing per 1M tokens
const HAIKU_INPUT_PRICE_PER_M = 0.25;
const HAIKU_OUTPUT_PRICE_PER_M = 1.25;

export type Classification =
  | "willing_to_meet"
  | "interested"
  | "not_interested"
  | "out_of_office"
  | "unsubscribe"
  | "other";

export interface QualifyReplyResult {
  classification: Classification;
  confidence: number;
  reasoning: string;
  costUsd: number;
  responseRaw: object;
}

/**
 * Qualify a reply using AI to determine intent
 */
export async function qualifyReply(
  apiKey: string,
  replyText: string,
  originalSubject?: string
): Promise<QualifyReplyResult> {
  const anthropic = new Anthropic({ apiKey });

  const prompt = `Analyze this email reply to a cold outreach and classify the sender's intent.

Original subject: ${originalSubject || "Unknown"}

Reply:
${replyText}

Classify the reply into ONE of these categories:
- willing_to_meet: The person explicitly agrees to a meeting, call, or demo
- interested: The person shows interest but hasn't committed to a meeting
- not_interested: The person declines or says they're not interested
- out_of_office: Auto-reply or out of office message
- unsubscribe: Request to be removed from future emails
- other: None of the above (spam, confused, etc.)

Respond in this exact JSON format:
{
  "classification": "willing_to_meet|interested|not_interested|out_of_office|unsubscribe|other",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const text = textContent?.type === "text" ? textContent.text : "{}";

  // Parse JSON response
  let parsed: { classification?: string; confidence?: number; reasoning?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { classification: "other", confidence: 0.5, reasoning: "Failed to parse AI response" };
  }

  // Calculate cost
  const tokensInput = response.usage.input_tokens;
  const tokensOutput = response.usage.output_tokens;
  const costUsd =
    (tokensInput / 1_000_000) * HAIKU_INPUT_PRICE_PER_M +
    (tokensOutput / 1_000_000) * HAIKU_OUTPUT_PRICE_PER_M;

  return {
    classification: (parsed.classification as Classification) || "other",
    confidence: parsed.confidence || 0.5,
    reasoning: parsed.reasoning || "",
    costUsd,
    responseRaw: response,
  };
}
