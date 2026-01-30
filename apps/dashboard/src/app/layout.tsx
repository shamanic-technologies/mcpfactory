import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const SITE_URL = "https://dashboard.mcpfactory.org";
const SITE_NAME = "MCP Factory Dashboard";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dashboard | MCP Factory",
    template: "%s | MCP Factory Dashboard",
  },
  description: "Manage your BYOK keys, campaigns, usage, and billing. Configure your MCP Factory automations.",
  keywords: [
    "MCP Factory",
    "dashboard",
    "BYOK",
    "campaigns",
    "automation",
    "API keys",
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
    title: "MCP Factory Dashboard",
    description: "Manage your BYOK keys, campaigns, and usage.",
    images: [
      {
        url: "https://mcpfactory.org/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MCP Factory Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "MCP Factory Dashboard",
    description: "Manage your MCP Factory automations.",
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "MCP Factory Dashboard",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Dashboard to manage BYOK keys, campaigns, and automation settings.",
  url: SITE_URL,
  provider: {
    "@type": "Organization",
    name: "MCP Factory",
    url: "https://mcpfactory.org",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
