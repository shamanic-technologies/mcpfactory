"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { StatusIndicator } from "./status-indicator";
import UseAnimations from "react-useanimations";
import lock from "react-useanimations/lib/lock";

export function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        <Link
          href="/"
          className={`
            flex items-center gap-2 px-3 py-2.5 rounded-xl transition group
            ${pathname === "/" ? "bg-primary-50 border border-primary-200" : "hover:bg-gray-50"}
          `}
        >
          <svg 
            className={`w-5 h-5 transition-transform group-hover:scale-110 ${pathname === "/" ? "text-primary-600" : "text-gray-600"}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className={`font-medium text-sm ${pathname === "/" ? "text-primary-700" : "text-gray-700"}`}>
            Home
          </span>
        </Link>
        
        <Link
          href="/brands"
          className={`
            flex items-center gap-2 px-3 py-2.5 rounded-xl transition
            ${pathname.startsWith("/brands") ? "bg-primary-50 border border-primary-200" : "hover:bg-gray-50"}
          `}
        >
          <svg 
            className={`w-5 h-5 ${pathname.startsWith("/brands") ? "text-primary-600" : "text-gray-600"}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className={`font-medium text-sm ${pathname.startsWith("/brands") ? "text-primary-700" : "text-gray-700"}`}>
            Brands
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
      </nav>

      <div className="p-2 border-t border-gray-100">
        <StatusIndicator />
      </div>
    </aside>
  );
}
