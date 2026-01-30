"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MCPS = [
  {
    id: "sales-outreach",
    name: "Sales Cold Emails",
    description: "URL to cold emails",
    available: true,
    href: "/mcp/sales-outreach",
  },
  {
    id: "influencer-pitch",
    name: "Influencer Pitch",
    description: "URL to influencer outreach",
    available: false,
    href: "/mcp/influencer-pitch",
  },
  {
    id: "journalist-pitch",
    name: "Journalist Pitch",
    description: "URL to press outreach",
    available: false,
    href: "/mcp/journalist-pitch",
  },
  {
    id: "thought-leader",
    name: "Thought Leadership",
    description: "URL to PR articles",
    available: false,
    href: "/mcp/thought-leader",
  },
  {
    id: "podcaster-pitch",
    name: "Podcaster Pitch",
    description: "URL to podcast outreach",
    available: false,
    href: "/mcp/podcaster-pitch",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    description: "URL to ad campaigns",
    available: false,
    href: "/mcp/google-ads",
  },
  {
    id: "reddit-ads",
    name: "Reddit Ads",
    description: "URL to Reddit campaigns",
    available: false,
    href: "/mcp/reddit-ads",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-display font-bold text-sm text-gray-500 uppercase tracking-wide">
          MCPs
        </h2>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {MCPS.map((mcp) => {
          const isActive = pathname.startsWith(mcp.href);
          const isAvailable = mcp.available;

          return (
            <Link
              key={mcp.id}
              href={isAvailable ? mcp.href : "#"}
              className={`
                block px-3 py-2.5 rounded-xl transition
                ${isActive ? "bg-primary-50 border border-primary-200" : "hover:bg-gray-50"}
                ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}
              `}
              onClick={(e) => !isAvailable && e.preventDefault()}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-medium text-sm ${isActive ? "text-primary-700" : "text-gray-700"}`}
                >
                  {mcp.name}
                </span>
                {!isAvailable && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
                {isAvailable && isActive && (
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{mcp.description}</p>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </Link>
      </div>
    </aside>
  );
}
