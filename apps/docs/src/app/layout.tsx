import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "MCP Factory Docs",
  description: "Documentation for MCP Factory - The DFY, BYOK MCP Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
