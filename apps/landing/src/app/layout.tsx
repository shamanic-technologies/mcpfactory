import type { Metadata } from "next";
import "./globals.css";
import { URLS } from "@mcpfactory/content";

const SITE_URL = URLS.landing;
const SITE_NAME = "MCP Factory";
const SITE_DESCRIPTION = "From URL to Revenue. Done-For-You automation via Model Context Protocol. You give us your URL + budget, we handle lead finding, outreach, optimization, and reporting.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MCP Factory - The DFY, BYOK MCP Platform",
    template: "%s | MCP Factory",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "MCP",
    "Model Context Protocol",
    "automation",
    "cold email",
    "outreach",
    "sales automation",
    "BYOK",
    "DFY",
    "done for you",
    "bring your own key",
    "AI automation",
    "lead generation",
    "ChatGPT",
    "Claude",
    "Cursor",
    "AI sales",
    "email automation",
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
    title: "MCP Factory - From URL to Revenue",
    description: "The DFY, BYOK MCP Platform. You give us your URL + budget. We give you customers.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MCP Factory - From URL to Revenue",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Factory - From URL to Revenue",
    description: "The DFY, BYOK MCP Platform. Done-For-You automation via MCP.",
    images: ["/og-image.jpg"],
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
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MCP Factory",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  offers: [
    {
      "@type": "Offer",
      name: "Free BYOK",
      price: "0",
      priceCurrency: "USD",
      description: "Free — bring your own API keys, pay only your API costs",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "127",
  },
  provider: {
    "@type": "Organization",
    name: "MCP Factory",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-head.jpg`,
    sameAs: [
      URLS.github,
      URLS.twitter,
    ],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MCP Factory",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-head.jpg`,
  description: "The DFY, BYOK MCP Platform",
  sameAs: [
    URLS.github,
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@mcpfactory.org",
    contactType: "customer service",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MCP Factory",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Launch a Sales Campaign with MCP Factory",
  description: "Launch automated cold email campaigns using AI from ChatGPT, Claude, or Cursor",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Sign up",
      text: "Create an account at dashboard.mcpfactory.org/sign-up",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Get API Key",
      text: "Go to Settings → API Key and copy your MCP Factory API key",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Configure BYOK Keys",
      text: "Add your Apollo and Anthropic keys in Settings → Keys",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Connect AI Client",
      text: `Add MCP Factory to ChatGPT, Claude, or Cursor using the MCP URL: ${URLS.mcp}`,
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Launch Campaign",
      text: "Ask your AI: 'Launch a cold email campaign for mybrand.com targeting CTOs at SaaS companies'",
    },
  ],
  totalTime: "PT5M",
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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
