"use client";

import { Campaign, CampaignStats } from "@/lib/api";

interface CampaignCardProps {
  campaign: Campaign;
  stats?: CampaignStats;
  onStop?: (id: string) => void;
  onResume?: (id: string) => void;
}

export function CampaignCard({ campaign, stats, onStop, onResume }: CampaignCardProps) {
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "ongoing": return "bg-green-100 text-green-700 border-green-200";
      case "stopped": return "bg-gray-100 text-gray-500 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  const openRate = stats && stats.emailsSent > 0 
    ? ((stats.emailsOpened || 0) / stats.emailsSent * 100).toFixed(1) 
    : null;
  const replyRate = stats && stats.emailsSent > 0 
    ? ((stats.emailsReplied || 0) / stats.emailsSent * 100).toFixed(1) 
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-800">{campaign.name}</h3>
          <p className="text-sm text-gray-500">
            Created {formatDate(campaign.createdAt)}
            {campaign.recurrence && campaign.recurrence !== "oneoff" && (
              <span className="ml-2 text-primary-600">• Runs {campaign.recurrence}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(campaign.status)}`}>
            {campaign.status}
          </span>
          {campaign.status === "ongoing" && onStop && (
            <button
              onClick={() => onStop(campaign.id)}
              className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Stop
            </button>
          )}
          {campaign.status === "stopped" && onResume && (
            <button
              onClick={() => onResume(campaign.id)}
              className="text-xs px-2 py-1 rounded border border-primary-200 text-primary-600 hover:bg-primary-50"
            >
              Resume
            </button>
          )}
        </div>
      </div>
      
      {/* Targeting tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {campaign.personTitles?.map((title) => (
          <span key={title} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {title}
          </span>
        ))}
        {campaign.organizationLocations?.map((loc) => (
          <span key={loc} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
            {loc}
          </span>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Leads</p>
          <p className="font-medium text-gray-800">{stats?.leadsFound || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Sent</p>
          <p className="font-medium text-gray-800">{stats?.emailsSent || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Opened</p>
          <p className="font-medium text-gray-800">
            {stats?.emailsOpened || 0}
            {openRate && <span className="text-xs text-gray-400 ml-1">({openRate}%)</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Clicked</p>
          <p className="font-medium text-gray-800">{stats?.emailsClicked || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Replied</p>
          <p className="font-medium text-accent-600">
            {stats?.emailsReplied || 0}
            {replyRate && <span className="text-xs text-gray-400 ml-1">({replyRate}%)</span>}
          </p>
        </div>
      </div>

      {/* Budget info */}
      {(campaign.maxBudgetDailyUsd || campaign.maxBudgetWeeklyUsd || campaign.maxBudgetMonthlyUsd) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Budget: 
            {campaign.maxBudgetDailyUsd && ` $${campaign.maxBudgetDailyUsd}/day`}
            {campaign.maxBudgetWeeklyUsd && ` $${campaign.maxBudgetWeeklyUsd}/week`}
            {campaign.maxBudgetMonthlyUsd && ` $${campaign.maxBudgetMonthlyUsd}/month`}
          </span>
        </div>
      )}
    </div>
  );
}
