import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Factory - The DFY, BYOK MCP Platform",
  description:
    "From URL to Revenue. Done-For-You automation via Model Context Protocol. Free tier + $20/mo upgrade.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "automation",
    "cold email",
    "outreach",
    "BYOK",
    "DFY",
  ],
  openGraph: {
    title: "MCP Factory - From URL to Revenue",
    description: "The DFY, BYOK MCP Platform. You give us your URL. We give you customers.",
    url: "https://mcpfactory.org",
    siteName: "MCP Factory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Factory - From URL to Revenue",
    description: "The DFY, BYOK MCP Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
