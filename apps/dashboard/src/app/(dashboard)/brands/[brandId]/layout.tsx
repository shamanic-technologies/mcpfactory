"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface Brand {
  id: string;
  domain: string;
  name: string | null;
  brandUrl: string;
}

const getBrandSidebarItems = (brandId: string) => [
  {
    id: "overview",
    label: "Overview",
    href: `/brands/${brandId}`,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "sales-profile",
    label: "Sales Profile",
    href: `/brands/${brandId}/sales-profile`,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "campaigns",
    label: "Campaigns",
    href: `/brands/${brandId}/campaigns`,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export default function BrandDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const brandId = params.brandId as string;
  const { getToken } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);

  useEffect(() => {
    async function fetchBrand() {
      try {
        const token = await getToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_CAMPAIGN_SERVICE_URL}/brands/${brandId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setBrand(data.brand);
        }
      } catch (error) {
        console.error("Failed to fetch brand:", error);
      }
    }
    if (brandId) {
      fetchBrand();
    }
  }, [brandId, getToken]);

  const sidebarItems = getBrandSidebarItems(brandId);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <Link 
            href="/brands" 
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-2 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Brands
          </Link>
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {brand?.name || brand?.domain || "Loading..."}
          </h3>
          {brand?.domain && (
            <p className="text-xs text-gray-400 truncate">{brand.domain}</p>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = item.id === "overview"
              ? pathname === item.href
              : pathname.startsWith(item.href);
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
                <span className={`${isActive ? "text-primary-600" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <Link href="/brands" className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
            {brand?.name || brand?.domain || "Loading..."}
          </span>
          <div className="w-8" />
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {sidebarItems.map((item) => {
            const isActive = item.id === "overview"
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition
                  ${isActive 
                    ? "bg-primary-100 text-primary-700 font-medium" 
                    : "bg-gray-100 text-gray-600"
                  }
                `}
              >
                <span className="w-4 h-4">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
