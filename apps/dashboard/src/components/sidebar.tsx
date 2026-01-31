"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { StatusIndicator } from "./status-indicator";
import UseAnimations from "react-useanimations";
import home2 from "react-useanimations/lib/home2";
import lock from "react-useanimations/lib/lock";
import mail from "react-useanimations/lib/mail";

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Home & API Keys */}
      <div className="p-2 border-b border-gray-100 space-y-1">
        <Link
          href="/"
          className={`
            flex items-center gap-2 px-3 py-2.5 rounded-xl transition
            ${pathname === "/" ? "bg-primary-50 border border-primary-200" : "hover:bg-gray-50"}
          `}
          onMouseEnter={() => setHoveredItem("home")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <UseAnimations
            animation={home2}
            size={20}
            autoplay={hoveredItem === "home"}
            loop={false}
            strokeColor={pathname === "/" ? "#0ea5e9" : "#374151"}
          />
          <span className={`font-medium text-sm ${pathname === "/" ? "text-primary-700" : "text-gray-700"}`}>
            Home
          </span>
        </Link>
        
        <Link
          href="/api-keys"
          className={`
            flex items-center gap-2 px-3 py-2.5 rounded-xl transition
            ${pathname === "/api-keys" ? "bg-primary-50 border border-primary-200" : "hover:bg-gray-50"}
          `}
          onMouseEnter={() => setHoveredItem("api-keys")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <UseAnimations
            animation={lock}
            size={20}
            autoplay={hoveredItem === "api-keys"}
            loop={false}
            strokeColor={pathname === "/api-keys" ? "#0ea5e9" : "#374151"}
          />
          <span className={`font-medium text-sm ${pathname === "/api-keys" ? "text-primary-700" : "text-gray-700"}`}>
            API Keys
          </span>
        </Link>
      </div>

      <div className="p-4 border-b border-gray-100">
        <h2 className="font-display font-bold text-sm text-gray-500 uppercase tracking-wide">
          MCPs
        </h2>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {MCPS.map((mcp) => {
          const isActive = pathname.startsWith(mcp.href);
          const isAvailable = mcp.available;
          const isHovered = hoveredItem === mcp.id;

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
              onMouseEnter={() => isAvailable && setHoveredItem(mcp.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mcp.id === "sales-outreach" && (
                    <UseAnimations
                      animation={mail}
                      size={18}
                      autoplay={isHovered}
                      loop={false}
                      strokeColor={isActive ? "#0ea5e9" : "#374151"}
                    />
                  )}
                  <span
                    className={`font-medium text-sm ${isActive ? "text-primary-700" : "text-gray-700"}`}
                  >
                    {mcp.name}
                  </span>
                </div>
                {!isAvailable && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
                {isAvailable && isActive && (
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 ml-6">{mcp.description}</p>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-100">
        <StatusIndicator />
      </div>
    </aside>
  );
}
