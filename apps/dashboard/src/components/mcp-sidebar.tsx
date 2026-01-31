"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface McpSidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface McpSidebarProps {
  items: McpSidebarItem[];
  title?: string;
}

export function McpSidebar({ items, title }: McpSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {title && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
                ${isActive 
                  ? "bg-primary-50 text-primary-700 font-medium border border-primary-200" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }
              `}
            >
              <span className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-gray-400"}`}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}
                `}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
