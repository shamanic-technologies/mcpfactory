import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://mcpfactory.org";
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
    "Claude",
    "Cursor",
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
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "1,000 emails free + BYOK costs",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "20",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      description: "10,000 emails/month + BYOK costs",
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
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      "https://github.com/shamanic-technologies/mcpfactory",
      "https://twitter.com/mcpfactory",
    ],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MCP Factory",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "The DFY, BYOK MCP Platform",
  sameAs: [
    "https://github.com/shamanic-technologies/mcpfactory",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@mcpfactory.org",
    contactType: "customer service",
  },
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
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
