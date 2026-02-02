export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export const SALES_FEATURES: Feature[] = [
  {
    icon: "🎯",
    title: "Find Qualified Leads",
    description: "Search 275M+ contacts via Apollo. Target by role, company size, industry, and more.",
  },
  {
    icon: "✨",
    title: "Personalized Emails",
    description: "Each email is unique. AI researches the recipient and crafts a personalized message.",
  },
  {
    icon: "📊",
    title: "Automatic A/B Testing",
    description: "Test subject lines, CTAs, and messaging. Optimizes based on real results.",
  },
  {
    icon: "📬",
    title: "Smart Sending",
    description: "Optimal send times, throttling, and warmup. Maximize deliverability automatically.",
  },
  {
    icon: "💬",
    title: "Reply Detection",
    description: "Qualifies replies as interested, not interested, or out of office. Focus on hot leads.",
  },
  {
    icon: "📈",
    title: "Real-time Analytics",
    description: "Track opens, clicks, replies, and meetings. See what's working in real-time.",
  },
];

export interface Step {
  number: number;
  title: string;
  description: string;
  code?: string;
  example?: string;
}

export const SALES_STEPS: Step[] = [
  {
    number: 1,
    title: "Connect Your AI",
    description: "Add MCP Factory to ChatGPT, Claude, or Cursor",
    code: "https://mcp.mcpfactory.org/mcp",
  },
  {
    number: 2,
    title: "Describe Your Campaign",
    description: "Tell the AI who to target and what to say",
    example: '"Send cold emails to CTOs at B2B SaaS companies about our dev tool"',
  },
  {
    number: 3,
    title: "We Handle The Rest",
    description: "Finds leads, writes emails, sends, and optimizes",
  },
  {
    number: 4,
    title: "You Get Meetings",
    description: "Reply to interested prospects and close deals",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const SALES_FAQ: FaqItem[] = [
  {
    question: "Is this really open source?",
    answer: "Yes! 100% open source under MIT license. You can self-host it, fork it, or contribute. Check out the GitHub repo.",
  },
  {
    question: "How many emails can I send?",
    answer: "Free: 500 emails (one-time). Hobby: 3,000/month. Standard: 100,000/month. Growth: 500,000/month. Plus BYOK costs for leads and AI.",
  },
  {
    question: "What are BYOK costs?",
    answer: "BYOK = Bring Your Own Key. You pay Apollo for leads (~$0.01/lead) and Anthropic for AI (~$0.01/email) directly at their rates. Full transparency, no markup.",
  },
  {
    question: "Will my emails land in spam?",
    answer: "We use best practices: proper warmup, optimal send times, throttling, and your own domain. Most users see 95%+ inbox placement.",
  },
  {
    question: "What AI assistants work with this?",
    answer: "ChatGPT (Plus, Pro, Team), Claude (Web, Desktop, Code), and Cursor IDE. Any MCP-compatible client works.",
  },
];

export interface SupportedClient {
  name: string;
  emoji: string;
  detail: string;
  docsPath: string;
}

export const SUPPORTED_CLIENTS: SupportedClient[] = [
  { name: "ChatGPT", emoji: "🤖", detail: "Plus, Pro, Team", docsPath: "/integrations/chatgpt" },
  { name: "Claude", emoji: "🧠", detail: "Web, Desktop, Code", docsPath: "/integrations/claude" },
  { name: "Cursor", emoji: "🖥️", detail: "IDE Integration", docsPath: "/integrations/cursor" },
];

export interface ByokProvider {
  name: string;
  purpose: string;
}

export const BYOK_PROVIDERS: ByokProvider[] = [
  { name: "OpenAI or Anthropic", purpose: "Email generation" },
  { name: "Apollo", purpose: "Lead finding & enrichment" },
  { name: "Resend", purpose: "Email sending" },
];
