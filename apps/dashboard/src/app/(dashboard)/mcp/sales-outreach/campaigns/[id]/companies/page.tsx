"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employeeCount: string | null;
  location: string | null;
  leadsCount: number;
}

export default function CampaignCompaniesPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://api.mcpfactory.org"}/v1/campaigns/${params.id}/companies`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setCompanies(data.companies || []);
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold text-gray-800">
          Companies
          <span className="ml-2 text-sm font-normal text-gray-500">({companies.length})</span>
        </h1>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="font-display font-bold text-lg text-gray-800 mb-2">No companies yet</h3>
          <p className="text-gray-600 text-sm">Companies will appear here once leads are found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Industry</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Size</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 font-medium text-sm">
                          {company.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{company.name}</p>
                        {company.domain && (
                          <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary-500 hover:underline">
                            {company.domain}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{company.industry || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{company.employeeCount || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{company.location || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                      {company.leadsCount} leads
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
