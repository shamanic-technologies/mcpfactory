import type { Metadata } from "next";
import { URLS } from "@mcpfactory/content";
import { Navbar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Factory Performance — Public Leaderboard",
  description:
    "100% transparent performance data from MCP Factory campaigns. See real open rates, reply rates, and cost-per-action across all brands and AI models.",
  openGraph: {
    title: "MCP Factory Performance — Public Leaderboard",
    description:
      "100% transparent performance data. Real open rates, reply rates, and cost-per-action.",
    url: URLS.performance,
    siteName: "MCP Factory Performance",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Factory Performance",
    description: "100% transparent campaign performance data.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <footer className="bg-gray-900 text-gray-400 py-8 px-4">
          <div className="max-w-4xl mx-auto text-center text-sm">
            <p className="mb-2">
              <a href={URLS.landing} className="hover:text-primary-400 transition">
                MCP Factory
              </a>
              {" — "}
              The DFY, BYOK MCP Platform
            </p>
            <p className="text-xs">
              All data is from real campaigns. Updated hourly.{" "}
              <a href={URLS.github} className="underline hover:text-gray-300">
                Open source methodology.
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
