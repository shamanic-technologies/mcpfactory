"use client";

import { useState } from "react";
import Image from "next/image";
import {
  formatPercent,
  formatCostCents,
  formatModelName,
  type BrandLeaderboardEntry,
  type ModelLeaderboardEntry,
} from "@/lib/fetch-leaderboard";

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

type SortKey = "openRate" | "clickRate" | "replyRate" | "costPerOpenCents" | "costPerClickCents" | "costPerReplyCents" | "emailsSent";

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 select-none"
      onClick={() => onSort(sortKey)}
    >
      {label} {active ? (currentDir === "desc" ? "↓" : "↑") : ""}
    </th>
  );
}

export function BrandLeaderboard({ brands }: { brands: BrandLeaderboardEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("replyRate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...brands].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === "desc" ? Number(bv) - Number(av) : Number(av) - Number(bv);
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Brand
            </th>
            <SortHeader label="Emails" sortKey="emailsSent" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="% Opens" sortKey="openRate" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="% Visits" sortKey="clickRate" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="% Replies" sortKey="replyRate" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="$/Open" sortKey="costPerOpenCents" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="$/Visit" sortKey="costPerClickCents" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="$/Reply" sortKey="costPerReplyCents" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((brand, i) => (
            <tr key={brand.brandId || brand.brandDomain || i} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  {brand.brandDomain && LOGO_DEV_TOKEN ? (
                    <Image
                      src={`https://img.logo.dev/${brand.brandDomain}?token=${LOGO_DEV_TOKEN}&size=64`}
                      alt={brand.brandDomain}
                      width={28}
                      height={28}
                      className="rounded"
                      unoptimized
                    />
                  ) : (
                    <div className="w-7 h-7 bg-primary-100 rounded flex items-center justify-center text-primary-600 text-sm font-bold">
                      {(brand.brandName || brand.brandDomain || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {brand.brandName || brand.brandDomain || "Unknown"}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{brand.emailsSent.toLocaleString()}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatPercent(brand.openRate)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatPercent(brand.clickRate)}</td>
              <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatPercent(brand.replyRate)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatCostCents(brand.costPerOpenCents)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatCostCents(brand.costPerClickCents)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatCostCents(brand.costPerReplyCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ModelLeaderboard({ models }: { models: ModelLeaderboardEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("replyRate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...models].sort((a, b) => {
    const av = a[sortKey as keyof ModelLeaderboardEntry] ?? 0;
    const bv = b[sortKey as keyof ModelLeaderboardEntry] ?? 0;
    return sortDir === "desc" ? Number(bv) - Number(av) : Number(av) - Number(bv);
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Model
            </th>
            <SortHeader label="Emails" sortKey="emailsSent" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="% Opens" sortKey="openRate" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="% Visits" sortKey="clickRate" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="% Replies" sortKey="replyRate" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="$/Open" sortKey="costPerOpenCents" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="$/Visit" sortKey="costPerClickCents" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortHeader label="$/Reply" sortKey="costPerReplyCents" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((model) => (
            <tr key={model.model} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">
                  {formatModelName(model.model)}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  {model.emailsGenerated.toLocaleString()} generated
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{model.emailsSent.toLocaleString()}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatPercent(model.openRate)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatPercent(model.clickRate)}</td>
              <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatPercent(model.replyRate)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatCostCents(model.costPerOpenCents)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatCostCents(model.costPerClickCents)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatCostCents(model.costPerReplyCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
