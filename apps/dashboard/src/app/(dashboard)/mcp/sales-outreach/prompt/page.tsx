"use client";

const EMAIL_PROMPT = `You are a professional sales copywriter. Write a personalized cold email for a potential client.

Lead Information:
- Name: {leadFirstName} {leadLastName}
- Title: {leadTitle}
- Company: {leadCompany}
- Industry: {leadIndustry}

Our Company:
- Name: {clientCompanyName}
- Description: {clientCompanyDescription}
- Value proposition: {clientValue}

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

const VARIABLES = [
  { name: "leadFirstName", source: "Apollo", description: "Lead's first name" },
  { name: "leadLastName", source: "Apollo", description: "Lead's last name" },
  { name: "leadTitle", source: "Apollo", description: "Lead's job title" },
  { name: "leadCompany", source: "Apollo", description: "Lead's company name" },
  { name: "leadIndustry", source: "Apollo", description: "Lead's company industry" },
  { name: "clientCompanyName", source: "Company Info", description: "Your company name (from scraped data)" },
  { name: "clientCompanyDescription", source: "Company Info", description: "Your company description (from scraped data)" },
  { name: "clientValue", source: "Company Info", description: "Your value proposition (from scraped data)" },
];

export default function PromptPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Generation Prompt</h1>
        <p className="text-gray-500 mt-1">
          This prompt is sent to Claude (Anthropic) to generate personalized cold emails
        </p>
      </div>

      {/* Variables */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Variables</h2>
        <div className="grid gap-3">
          {VARIABLES.map((variable) => (
            <div key={variable.name} className="flex items-center gap-4 text-sm">
              <code className="bg-primary-50 text-primary-700 px-2 py-1 rounded font-mono">
                {`{${variable.name}}`}
              </code>
              <span className="text-gray-400">→</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {variable.source}
              </span>
              <span className="text-gray-600">{variable.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">System Prompt</h2>
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
            Claude 3.5 Sonnet
          </span>
        </div>
        <pre className="p-4 text-sm text-gray-700 font-mono whitespace-pre-wrap bg-gray-50/50 overflow-x-auto">
          {EMAIL_PROMPT}
        </pre>
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works</p>
            <p>
              When a campaign runs, we search leads via Apollo, then for each lead we call Claude with this prompt.
              The variables are replaced with actual data from Apollo (lead info) and your scraped Company Info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
