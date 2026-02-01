import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-5";

// Pricing per 1M tokens - Opus 4.5
const OPUS_INPUT_PRICE_PER_M = 5;
const OPUS_OUTPUT_PRICE_PER_M = 25;

export interface GenerateEmailParams {
  leadFirstName: string;
  leadLastName?: string;
  leadTitle?: string;
  leadCompany: string;
  leadIndustry?: string;
  clientCompanyName: string;
  clientCompanyDescription: string;
  clientValue?: string;
}

export interface GenerateEmailResult {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  promptRaw: string;
  responseRaw: object;
}

/**
 * Generate a personalized cold email using Claude Opus 4.5
 */
export async function generateEmail(
  apiKey: string,
  params: GenerateEmailParams
): Promise<GenerateEmailResult> {
  const anthropic = new Anthropic({ apiKey });

  const prompt = buildPrompt(params);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const text = textContent?.type === "text" ? textContent.text : "";

  // Parse the response
  const { subject, bodyHtml, bodyText } = parseEmailResponse(text);

  // Calculate cost
  const tokensInput = response.usage.input_tokens;
  const tokensOutput = response.usage.output_tokens;
  const costUsd =
    (tokensInput / 1_000_000) * OPUS_INPUT_PRICE_PER_M +
    (tokensOutput / 1_000_000) * OPUS_OUTPUT_PRICE_PER_M;

  return {
    subject,
    bodyHtml,
    bodyText,
    tokensInput,
    tokensOutput,
    costUsd,
    promptRaw: prompt,
    responseRaw: response,
  };
}

function buildPrompt(params: GenerateEmailParams): string {
  return `You are an expert sales copywriter. Write a personalized cold email for a potential client.

## Lead Information
- Name: ${params.leadFirstName}${params.leadLastName ? ` ${params.leadLastName}` : ""}
- Title: ${params.leadTitle || "Unknown"}
- Company: ${params.leadCompany}
- Industry: ${params.leadIndustry || "Unknown"}

## Our Company
- Name: ${params.clientCompanyName}
- Description: ${params.clientCompanyDescription}
${params.clientValue ? `- Value proposition: ${params.clientValue}` : ""}

## Reference: Cold Email Frameworks
Use your expertise to craft the email. Here are proven frameworks for reference:

**PAS (Problem-Agitate-Solution)**: Identify a problem, amplify its consequences, present solution.

**BAB (Before-After-Bridge)**: Describe current pain (Before), paint ideal future (After), position solution as the bridge.

**AIDA (Attention-Interest-Desire-Action)**: Hook attention, build interest with value, create desire, end with CTA.

**SPIN (Situation-Problem-Implication-Need-Payoff)**: Neil Rackham's framework - understand situation, surface problems, explore implications, highlight payoff of solving.

## Reference: Industry Best Practices (Gong Research, 28M+ emails analyzed)
- Avoid product pitches in cold emails (reduces replies by 57%)
- Use "interest CTAs" ("thoughts?" not "15 min call?") - 2x more effective
- Avoid buzzwords in subject lines (reduces open rates by 17.9%)
- No ROI claims, no "AI", no jargon in first touch
- Focus on problems you solve, not features you have
- Top performers: 8.1x more meetings than average

## Task
Write a compelling cold email using your judgment. Apply or combine frameworks as you see fit.

Keep it short (3-4 sentences max). Be genuine, not salesy. End with a low-friction CTA.
Do NOT use placeholder text like [Your Name] - leave signature simple.

## Output Format
SUBJECT: [subject line]
---
[email body in plain text]`;
}

function parseEmailResponse(text: string): {
  subject: string;
  bodyHtml: string;
  bodyText: string;
} {
  const lines = text.trim().split("\n");
  let subject = "";
  let bodyLines: string[] = [];
  let inBody = false;

  for (const line of lines) {
    if (line.startsWith("SUBJECT:")) {
      subject = line.replace("SUBJECT:", "").trim();
    } else if (line.trim() === "---") {
      inBody = true;
    } else if (inBody) {
      bodyLines.push(line);
    }
  }

  const bodyText = bodyLines.join("\n").trim();
  // Convert to basic HTML
  const bodyHtml = bodyText
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return { subject, bodyHtml, bodyText };
}
