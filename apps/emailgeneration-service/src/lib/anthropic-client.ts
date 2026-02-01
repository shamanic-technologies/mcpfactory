import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-5-20251101";

// Pricing per 1M tokens (as of 2024)
const HAIKU_INPUT_PRICE_PER_M = 0.25;
const HAIKU_OUTPUT_PRICE_PER_M = 1.25;

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
 * Generate a personalized cold email using Anthropic Haiku
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
    (tokensInput / 1_000_000) * HAIKU_INPUT_PRICE_PER_M +
    (tokensOutput / 1_000_000) * HAIKU_OUTPUT_PRICE_PER_M;

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
  return `You are a professional sales copywriter. Write a personalized cold email for a potential client.

Lead Information:
- Name: ${params.leadFirstName}${params.leadLastName ? ` ${params.leadLastName}` : ""}
- Title: ${params.leadTitle || "Unknown"}
- Company: ${params.leadCompany}
- Industry: ${params.leadIndustry || "Unknown"}

Our Company:
- Name: ${params.clientCompanyName}
- Description: ${params.clientCompanyDescription}
${params.clientValue ? `- Value proposition: ${params.clientValue}` : ""}

Guidelines:
1. Keep it short (3-4 sentences max)
2. Personalize based on their company and role
3. Focus on value, not features
4. End with a clear, low-friction call to action
5. Use a professional but warm tone
6. Do NOT use placeholder text like [Your Name] - leave the signature simple

Respond in this exact format:
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
