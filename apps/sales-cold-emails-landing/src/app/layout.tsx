import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://salescoldemail.mcpfactory.org";
const SITE_NAME = "Sales Cold Emails | MCP Factory";
const SITE_DESCRIPTION = "Open-source cold email automation. Find leads, generate personalized emails, send at scale. 100% open-source, works with ChatGPT, Claude, and Cursor.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sales Cold Emails - Open Source Cold Email Automation | MCP Factory",
    template: "%s | Sales Cold Emails",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "cold email",
    "cold email automation",
    "sales cold emails",
    "cold email software",
    "cold email tool",
    "open source cold email",
    "email outreach",
    "B2B cold email",
    "cold email campaigns",
    "automated cold email",
    "personalized cold email",
    "cold email at scale",
    "lead generation",
    "sales prospecting",
    "outbound sales",
    "MCP",
    "Model Context Protocol",
    "open source",
    "BYOK",
  ],
  authors: [{ name: "MCP Factory" }],
  creator: "MCP Factory",
  publisher: "MCP Factory",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Sales Cold Emails - Open Source Cold Email Automation",
    description: "100% open-source cold email automation. Find leads, generate personalized emails, send at scale.",
    images: [
      {
        url: "https://mcpfactory.org/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sales Cold Emails",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sales Cold Emails - Open Source Cold Email Automation",
    description: "100% open-source cold email automation. Find leads, generate personalized emails, send at scale.",
    images: ["https://mcpfactory.org/og-image.jpg"],
    creator: "@mcpfactory",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "https://mcpfactory.org/favicon.jpg",
    shortcut: "https://mcpfactory.org/favicon.jpg",
    apple: "https://mcpfactory.org/favicon.jpg",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sales Cold Emails by MCP Factory",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Email Marketing Software",
  operatingSystem: "Web",
  description: "Open-source cold email automation platform. Launch personalized cold email campaigns from ChatGPT, Claude, or Cursor.",
  url: SITE_URL,
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "500 emails (one-time)",
    },
    {
      "@type": "Offer",
      name: "Hobby",
      price: "16",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      description: "3,000 emails/month",
    },
    {
      "@type": "Offer",
      name: "Standard",
      price: "83",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      description: "100,000 emails/month",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "333",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      description: "500,000 emails/month",
    },
  ],
  featureList: [
    "100% open-source",
    "Lead search via Apollo",
    "AI-powered email personalization",
    "Automatic A/B testing",
    "Reply detection and qualification",
    "ChatGPT integration",
    "Claude integration",
    "Cursor IDE integration",
  ],
  provider: {
    "@type": "Organization",
    name: "MCP Factory",
    url: "https://mcpfactory.org",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is AI cold email automation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI cold email automation uses artificial intelligence to find leads, generate personalized emails, and send them at scale. MCP Factory connects to ChatGPT, Claude, or Cursor so you can launch campaigns with simple prompts like 'Send cold emails to CTOs at SaaS companies'.",
      },
    },
    {
      "@type": "Question",
      name: "How does MCP Factory cold email work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You connect MCP Factory to your AI assistant (ChatGPT, Claude, or Cursor), provide your website URL and target audience, and the AI handles everything: finding leads via Apollo, generating personalized emails, sending them, and optimizing based on results.",
      },
    },
    {
      "@type": "Question",
      name: "How much does cold email automation cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MCP Factory offers 1,000 free emails to start. The Pro plan is $20/month for 10,000 emails. You also pay for the underlying services (Apollo for leads, Anthropic for AI) at their standard rates - typically around $0.02 per email total.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use my own email domain?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! MCP Factory sends emails from your own domain for maximum deliverability. You connect your email provider and we handle the sending, tracking, and optimization.",
      },
    },
    {
      "@type": "Question",
      name: "Is AI cold email effective?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI-generated cold emails typically see 2-3x higher response rates than templates because each email is personalized to the recipient's company, role, and recent activities. MCP Factory automatically A/B tests subject lines and content to continuously improve.",
      },
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Send AI Cold Emails",
  description: "Launch an AI-powered cold email campaign in 5 minutes",
  totalTime: "PT5M",
  estimatedCost: {
    "@type": "MonetaryAmount",
    currency: "USD",
    value: "0",
  },
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Create Account",
      text: "Sign up at dashboard.mcpfactory.org - it's free",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Connect Your AI",
      text: "Add MCP Factory to ChatGPT, Claude, or Cursor using our MCP URL",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Add Your Keys",
      text: "Connect your Apollo account for leads and Anthropic for AI",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Launch Campaign",
      text: "Tell your AI: 'Send cold emails to [target] about [your product]'",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Watch Results",
      text: "Monitor opens, clicks, and replies in your dashboard",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
