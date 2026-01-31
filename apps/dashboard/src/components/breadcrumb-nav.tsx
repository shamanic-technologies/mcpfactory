"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isDropdown?: boolean;
}

// MCP definitions for breadcrumb
const MCP_MAP: Record<string, { name: string; icon: string }> = {
  "sales-outreach": { name: "Sales Cold Emails", icon: "📧" },
};

export function BreadcrumbNav() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setOrgMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOrgSwitch = (orgId: string) => {
    if (setActive) {
      setActive({ organization: orgId });
    }
    setOrgMenuOpen(false);
  };

  // Build breadcrumb items from pathname
  const items: BreadcrumbItem[] = [];

  // Always show org first
  items.push({
    label: organization?.name || "Select org",
    isDropdown: true,
  });

  // Parse pathname for MCP and campaign
  const pathParts = pathname.split("/").filter(Boolean);
  
  // Check if we're in an MCP
  if (pathParts[0] === "mcp" && pathParts[1]) {
    const mcpSlug = pathParts[1];
    const mcp = MCP_MAP[mcpSlug];
    if (mcp) {
      items.push({
        label: mcp.name,
        href: `/mcp/${mcpSlug}`,
      });
    }
  }

  // Check if we're in a campaign (future: /mcp/sales-outreach/campaigns/:id)
  if (pathParts[0] === "mcp" && pathParts[2] === "campaigns" && pathParts[3]) {
    items.push({
      label: "Campaign Details", // Would be campaign name from API
      href: pathname,
    });
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <svg className="w-4 h-4 text-gray-300 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          )}

          {item.isDropdown ? (
            <div className="relative" ref={orgMenuRef}>
              <button
                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition"
              >
                <div className="w-5 h-5 bg-primary-100 rounded flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-xs">
                    {organization?.name?.[0] || "O"}
                  </span>
                </div>
                <span className="font-medium text-gray-800 max-w-[140px] truncate">
                  {item.label}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition ${orgMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {orgMenuOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Switch organization</p>
                  </div>
                  {userMemberships?.data?.map((membership) => (
                    <button
                      key={membership.organization.id}
                      onClick={() => handleOrgSwitch(membership.organization.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${
                        organization?.id === membership.organization.id
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 font-semibold text-xs">
                          {membership.organization.name[0]}
                        </span>
                      </div>
                      <span className="truncate">{membership.organization.name}</span>
                      {organization?.id === membership.organization.id && (
                        <svg className="w-4 h-4 text-primary-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : item.href ? (
            <Link
              href={item.href}
              className={`px-2 py-1 rounded-md transition ${
                pathname === item.href
                  ? "font-medium text-gray-800"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-2 py-1 font-medium text-gray-800">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
