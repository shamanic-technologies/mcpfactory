"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

interface Brand {
  id: string;
  domain: string;
  name: string | null;
  brandUrl: string;
  createdAt: string;
}

export function BrandsList() {
  const { getToken } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const token = await getToken();
        // Use API gateway which proxies to brand-service
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/brands`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setBrands(data.brands || []);
        }
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBrands();
  }, [getToken]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg text-gray-800">Your Brands</h2>
        <Link href="/brands" className="text-sm text-primary-500 hover:text-primary-600">
          View all →
        </Link>
      </div>

      {brands.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 text-center">
          <GlobeAltIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No brands yet. Brands are created automatically when you start a campaign via MCP.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {brands.slice(0, 6).map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <GlobeAltIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {brand.name || brand.domain}
                </h3>
                <p className="text-xs text-gray-500 truncate">{brand.domain}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
