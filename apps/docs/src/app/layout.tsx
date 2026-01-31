import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

const SITE_URL = "https://docs.mcpfactory.org";
const SITE_NAME = "MCP Factory Documentation";
const SITE_DESCRIPTION = "Complete documentation for MCP Factory - installation, configuration, API reference, and integration guides for n8n, Zapier, Make.com, and Cursor.";

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
    "integration",
    "n8n",
    "Zapier",
    "Make.com",
    "Cursor",
    "BYOK",
    "tutorial",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "MCP Factory Documentation",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  author: {
    "@type": "Organization",
    name: "MCP Factory",
    url: "https://mcpfactory.org",
  },
  publisher: {
    "@type": "Organization",
    name: "MCP Factory",
    url: "https://mcpfactory.org",
    logo: {
      "@type": "ImageObject",
      url: "https://mcpfactory.org/logo-head.jpg",
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": SITE_URL,
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </head>
      <body className="antialiased">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
