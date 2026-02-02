export interface PricingTier {
  name: string;
  description: string;
  price: number;
  period: string;
  emails: string;
  features: string[];
  cta: string;
  popular: boolean;
}

/**
 * Full 4-tier pricing used on the sales-cold-emails-landing page.
 */
export const SALES_PRICING_TIERS: PricingTier[] = [
  {
    name: "Free",
    description: "Try it out",
    price: 0,
    period: "one-time",
    emails: "500",
    features: ["500 emails (one-time)", "2 concurrent requests", "Basic rate limits"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Hobby",
    description: "For side projects",
    price: 16,
    period: "/month",
    emails: "3,000",
    features: ["3,000 emails/month", "5 concurrent requests", "Basic support"],
    cta: "Subscribe",
    popular: false,
  },
  {
    name: "Standard",
    description: "For scaling teams",
    price: 83,
    period: "/month",
    emails: "100,000",
    features: ["100,000 emails/month", "50 concurrent requests", "Standard support"],
    cta: "Subscribe",
    popular: true,
  },
  {
    name: "Growth",
    description: "High volume",
    price: 333,
    period: "/month",
    emails: "500,000",
    features: ["500,000 emails/month", "100 concurrent requests", "Priority support"],
    cta: "Subscribe",
    popular: false,
  },
];

/**
 * Simplified 2-tier pricing used on the main landing page.
 */
export const LANDING_PRICING = {
  free: { label: "Free tier", display: "$0 + your API costs" },
  pro: { label: "Pro", display: "$20/mo" },
} as const;

/**
 * Pricing for docs pages (sales-outreach).
 */
export const DOCS_PRICING = {
  free: { price: "$0", emails: "1,000 emails", detail: "Free + BYOK costs" },
  pro: { price: "$20/mo", emails: "10,000 emails/month", detail: "Pro + BYOK costs" },
  estimatedByokCost: "~$0.02/email",
} as const;

export const BYOK_COST_ESTIMATES = {
  apolloPerLead: "~$0.01/lead",
  anthropicPerEmail: "~$0.01/email",
  totalPerEmail: "~$0.02/email",
} as const;

export const API_RATE_LIMITS = {
  free: "100 requests/minute",
  pro: "1,000 requests/minute",
} as const;
