"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { OrgActivator } from "@/components/org-activator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Hide main sidebar when in campaign detail view (it has its own sidebar)
  const pathParts = pathname.split("/").filter(Boolean);
  const isInCampaignDetail = pathParts[0] === "mcp" && pathParts[2] === "campaigns" && pathParts[3];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <OrgActivator />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {!isInCampaignDetail && <Sidebar />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
