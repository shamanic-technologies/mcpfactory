import type { Metadata } from "next";
import "./globals.css";
import { DocsLayout } from "@/components/docs-layout";

const SITE_URL = "https://docs.mcpfactory.org";
const SITE_NAME = "MCP Factory Documentation";
const SITE_DESCRIPTION = "Complete documentation for MCP Factory - AI-powered sales automation via MCP. Integration guides for ChatGPT, Claude, Cursor, n8n, Zapier, and Make.com.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MCP Factory Documentation",
    template: "%s | MCP Factory Docs",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "MCP Factory",
    "documentation",
    "API",
    "MCP",
    "Model Context Protocol",
    "ChatGPT integration",
    "Claude integration",
    "Cursor integration",
    "n8n",
    "Zapier",
    "Make.com",
    "sales automation",
    "cold email",
    "lead generation",
    "BYOK",
    "AI sales",
  ],
  authors: [{ name: "MCP Factory" }],
  creator: "MCP Factory",
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
    title: "MCP Factory Documentation",
    description: "Learn how to use MCP Factory - installation, API reference, and integrations.",
    images: [
      {
        url: "https://mcpfactory.org/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MCP Factory Documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Factory Documentation",
    description: "Complete guides and API reference for MCP Factory.",
    images: ["https://mcpfactory.org/og-image.jpg"],
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MCP Factory",
  url: "https://mcpfactory.org",
  logo: "https://mcpfactory.org/logo-head.jpg",
  sameAs: [
    "https://github.com/mcpfactory",
  ],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MCP Factory",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "AI-powered sales automation platform using Model Context Protocol (MCP). Launch cold email campaigns, find leads, and automate outreach from ChatGPT, Claude, or Cursor.",
  url: "https://mcpfactory.org",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier available with BYOK pricing",
  },
  featureList: [
    "Cold email campaign automation",
    "Lead search via Apollo",
    "AI-powered email generation",
    "ChatGPT integration",
    "Claude integration", 
    "Cursor IDE integration",
    "Webhook notifications",
    "REST API access",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: "MCP Factory",
    url: "https://mcpfactory.org",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "MCP Factory",
      item: "https://mcpfactory.org",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Documentation",
      item: SITE_URL,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is MCP Factory?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MCP Factory is an AI-powered sales automation platform that uses the Model Context Protocol (MCP) to enable AI assistants like ChatGPT, Claude, and Cursor to launch and manage cold email campaigns, find leads, and automate outreach.",
      },
    },
    {
      "@type": "Question",
      name: "How do I connect MCP Factory to ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Go to ChatGPT Settings → Connectors → Add Custom Connector. Enter the MCP URL: https://mcp.mcpfactory.org/mcp and add your API key as a Bearer token in the Authorization header.",
      },
    },
    {
      "@type": "Question",
      name: "How do I connect MCP Factory to Claude?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For Claude.ai, go to Settings → Integrations → Add more. Enter 'MCP Factory' as the name and https://mcp.mcpfactory.org/mcp as the URL. For Claude Desktop, edit the claude_desktop_config.json file.",
      },
    },
    {
      "@type": "Question",
      name: "How do I connect MCP Factory to Cursor?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Add the MCP configuration to your .cursor/mcp.json file with the URL https://mcp.mcpfactory.org/mcp and your API key in the Authorization header. Restart Cursor after saving.",
      },
    },
    {
      "@type": "Question",
      name: "What is BYOK pricing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "BYOK (Bring Your Own Key) means you use your own API keys for underlying services like OpenAI, Anthropic, and Apollo. You pay those providers directly at their rates, giving you full control over costs and usage.",
      },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className="antialiased h-screen flex flex-col overflow-hidden">
        <DocsLayout>{children}</DocsLayout>
      </body>
    </html>
  );
}
