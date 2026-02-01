"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { OrgActivator } from "@/components/org-activator";
import { MobileSidebarProvider, useMobileSidebar } from "@/components/mobile-sidebar-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, close } = useMobileSidebar();
  
  // Hide main sidebar when inside an MCP or brand (each has its own contextual sidebar)
  const pathParts = pathname.split("/").filter(Boolean);
  const isInsideMcp = pathParts[0] === "mcp" && pathParts[1];
  const isInsideBrand = pathParts[0] === "brands" && pathParts[1];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <OrgActivator />
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={close}
          />
        )}
        
        {/* Mobile sidebar drawer */}
        <div className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <Sidebar />
        </div>
        
        {/* Desktop sidebar */}
        {!isInsideMcp && !isInsideBrand && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileSidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </MobileSidebarProvider>
  );
}
