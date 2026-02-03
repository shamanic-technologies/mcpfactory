"use client";

import { useState } from "react";
import { BrandLeaderboard, ModelLeaderboard } from "./leaderboard-table";
import type { BrandLeaderboardEntry, ModelLeaderboardEntry } from "@/lib/fetch-leaderboard";

type Tab = "brands" | "models";

export function LeaderboardTabs({
  brands,
  models,
}: {
  brands: BrandLeaderboardEntry[];
  models: ModelLeaderboardEntry[];
}) {
  const [tab, setTab] = useState<Tab>("brands");

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <button
          onClick={() => setTab("brands")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition ${
            tab === "brands"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          By Brand {brands.length > 0 && <span className="text-xs text-gray-400 ml-1">({brands.length})</span>}
        </button>
        <button
          onClick={() => setTab("models")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition ${
            tab === "models"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          By Model {models.length > 0 && <span className="text-xs text-gray-400 ml-1">({models.length})</span>}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {tab === "brands" ? (
          brands.length > 0 ? (
            <BrandLeaderboard brands={brands} />
          ) : (
            <div className="text-center py-12 text-gray-500">No brand data yet.</div>
          )
        ) : models.length > 0 ? (
          <ModelLeaderboard models={models} />
        ) : (
          <div className="text-center py-12 text-gray-500">No model data yet.</div>
        )}
      </div>
    </div>
  );
}
