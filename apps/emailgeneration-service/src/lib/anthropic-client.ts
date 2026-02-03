import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-5";

// Pricing per 1M tokens - Opus 4.5
const OPUS_INPUT_PRICE_PER_M = 5;
const OPUS_OUTPUT_PRICE_PER_M = 25;

export interface GenerateEmailParams {
  // Lead (person) info
  leadFirstName: string;
  leadLastName?: string;
  leadTitle?: string;
  leadEmail?: string;
  leadLinkedinUrl?: string;
  // Lead company info
  leadCompanyName: string;
  leadCompanyDomain?: string;
  leadCompanyIndustry?: string;
  leadCompanySize?: string;
  leadCompanyRevenueUsd?: string;
  // Client (our company) info
  clientCompanyName: string;
  clientBrandUrl?: string;
  clientCompanyOverview?: string;
  clientValueProposition?: string;
  clientTargetAudience?: string;
  clientCustomerPainPoints?: string[];
  clientKeyFeatures?: string[];
  clientProductDifferentiators?: string[];
  clientCompetitors?: string[];
  clientSocialProof?: {
    caseStudies?: string[];
    testimonials?: string[];
    results?: string[];
  };
  clientCallToAction?: string;
  clientAdditionalContext?: string;
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
  const parsed = parseEmailResponse(text);

  // Append signature
  const brandUrl = params.clientBrandUrl || "";
  const signature = buildSignature(brandUrl);
  const bodyHtml = parsed.bodyHtml + signature.html;
  const bodyText = parsed.bodyText + signature.text;
  const subject = parsed.subject;

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
  // Build lead company section
  const leadCompanyInfo = [
    `- Company: ${params.leadCompanyName}`,
    params.leadCompanyDomain ? `- Website: ${params.leadCompanyDomain}` : null,
    params.leadCompanyIndustry ? `- Industry: ${params.leadCompanyIndustry}` : null,
    params.leadCompanySize ? `- Size: ${params.leadCompanySize} employees` : null,
    params.leadCompanyRevenueUsd ? `- Revenue: $${params.leadCompanyRevenueUsd}` : null,
  ].filter(Boolean).join("\n");

  // Build social proof section
  let socialProofSection = "";
  if (params.clientSocialProof) {
    const parts = [];
    if (params.clientSocialProof.results?.length) {
      parts.push(`  - Results: ${params.clientSocialProof.results.join("; ")}`);
    }
    if (params.clientSocialProof.testimonials?.length) {
      parts.push(`  - Testimonials: "${params.clientSocialProof.testimonials.slice(0, 2).join('"; "')}"`);
    }
    if (params.clientSocialProof.caseStudies?.length) {
      parts.push(`  - Case studies: ${params.clientSocialProof.caseStudies.slice(0, 2).join("; ")}`);
    }
    if (parts.length) {
      socialProofSection = `- Social proof:\n${parts.join("\n")}`;
    }
  }

  return `You are an expert sales copywriter. Write a personalized cold email for a potential client.

## Lead (Prospect) Information
- Name: ${params.leadFirstName}${params.leadLastName ? ` ${params.leadLastName}` : ""}
- Title: ${params.leadTitle || "Unknown"}
${params.leadLinkedinUrl ? `- LinkedIn: ${params.leadLinkedinUrl}` : ""}

## Lead's Company
${leadCompanyInfo}

## Our Company (Sender)
- Name: ${params.clientCompanyName}
${params.clientBrandUrl ? `- Website: ${params.clientBrandUrl}` : ""}
${params.clientCompanyOverview ? `- Overview: ${params.clientCompanyOverview}` : ""}
${params.clientValueProposition ? `- Value proposition: ${params.clientValueProposition}` : ""}
${params.clientTargetAudience ? `- Target audience: ${params.clientTargetAudience}` : ""}
${params.clientCustomerPainPoints?.length ? `- Pain points we solve: ${params.clientCustomerPainPoints.join("; ")}` : ""}
${params.clientKeyFeatures?.length ? `- Key features: ${params.clientKeyFeatures.join("; ")}` : ""}
${params.clientProductDifferentiators?.length ? `- Differentiators: ${params.clientProductDifferentiators.join("; ")}` : ""}
${params.clientCompetitors?.length ? `- Competitors: ${params.clientCompetitors.join(", ")}` : ""}
${socialProofSection}
${params.clientCallToAction ? `- Primary CTA: ${params.clientCallToAction}` : ""}
${params.clientAdditionalContext ? `- Additional context: ${params.clientAdditionalContext}` : ""}

## Reference: Cold Email Frameworks
Use your expertise to craft the email. Here are proven frameworks for reference:

**PAS (Problem-Agitate-Solution)**
Identify a problem, amplify its consequences, present solution.
Example: "Managing leads across spreadsheets is slowing your team down. Every hour spent on manual entry is an hour not closing deals. [Product] automates lead capture so your reps focus on selling."

**BAB (Before-After-Bridge)**
Describe current pain (Before), paint ideal future (After), position solution as the bridge.
Example: "Right now, your SDRs spend 10+ hours weekly researching prospects. Imagine if they had instant access to verified contact data. That's exactly what [Product] delivers."

**AIDA (Attention-Interest-Desire-Action)**
Hook attention, build interest with value, create desire, end with CTA.
Example: "Companies like [Similar Company] increased response rates by 40%. We help sales teams personalize outreach at scale. Would it be worth a quick look?"

**SPIN (Situation-Problem-Implication-Need-Payoff)**
Neil Rackham's framework - acknowledge situation, surface problems, explore implications, highlight payoff.
Example: "Noticed [Company] is expanding into EMEA. Scaling outreach to new markets often means hiring more SDRs. What if you could 3x outreach without adding headcount?"

## Reference: Industry Best Practices (Gong Research, 28M+ emails analyzed)
- Avoid product pitches in cold emails (reduces replies by 57%)
- Use "interest CTAs" ("thoughts?" not "15 min call?") - 2x more effective
- Avoid buzzwords in subject lines (reduces open rates by 17.9%)
- No ROI claims, no "AI", no jargon in first touch
- Focus on problems you solve, not features you have
- Top performers: 8.1x more meetings than average

## Task
Write a compelling cold email using your judgment. Apply or combine frameworks as you see fit based on the lead and company data provided.

Keep it short (3-4 sentences max). Be genuine, not salesy. End with a low-friction CTA.
${params.clientBrandUrl ? `You MUST naturally mention the company website URL (${params.clientBrandUrl}) somewhere in the email body.` : ""}
Do NOT use placeholder text like [Your Name] - leave signature simple. Do NOT add any signature block — it will be appended automatically.

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

const KEVIN_PHOTO_URL =
  "https://media.licdn.com/dms/image/v2/D4E03AQExHRKHGkfXdA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1696248223118?e=2147483647&v=beta&t=B8ASFxYpZNDdcCSZ3NS_-OhnBgDYQPb4Z5HuIjsBrrE";

function buildSignature(brandUrl: string): { html: string; text: string } {
  const brandLine = brandUrl
    ? `Email generated with AI on behalf of our client: <a href="${brandUrl}" style="color:#9ca3af">${brandUrl}</a>`
    : "";
  const brandLineText = brandUrl
    ? `Email generated with AI on behalf of our client: ${brandUrl}`
    : "";

  const html = `
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px" />
<table cellpadding="0" cellspacing="0" style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#374151;line-height:1.4">
  <tr>
    <td style="padding-right:14px;vertical-align:top">
      <img src="${KEVIN_PHOTO_URL}" alt="Kevin Lourd" width="56" height="56" style="border-radius:50%;display:block" />
    </td>
    <td style="vertical-align:top">
      <p style="margin:0;font-weight:600;color:#111827">Kevin Lourd</p>
      <p style="margin:2px 0 0;color:#6b7280">Growth Agency</p>
      <p style="margin:2px 0 0">
        <a href="https://growthagency.dev" style="color:#10b981;text-decoration:none;font-weight:500">GrowthAgency.dev</a>
      </p>
    </td>
  </tr>
</table>
${brandLine ? `<p style="margin:12px 0 0;font-size:11px;color:#9ca3af;font-style:italic">${brandLine}</p>` : ""}
<p style="margin:6px 0 0;font-size:11px;color:#b5b5b5">
  <a href="https://growthagency.dev/unsubscribe" style="color:#b5b5b5;text-decoration:underline">Unsubscribe</a> to stop receiving sales cold emails from us
</p>`;

  const text = `
--
Kevin Lourd
Growth Agency | GrowthAgency.dev
${brandLineText ? `\n${brandLineText}` : ""}
Unsubscribe: https://growthagency.dev/unsubscribe`;

  return { html, text };
}
