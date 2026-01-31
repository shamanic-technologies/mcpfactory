"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";

interface Email {
  id: string;
  leadId: string;
  leadName: string | null;
  leadEmail: string;
  subject: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
}

export default function CampaignEmailsPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmails() {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://api.mcpfactory.org"}/v1/campaigns/${params.id}/emails`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setEmails(data.emails || []);
        }
      } catch (err) {
        console.error("Failed to load emails:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEmails();
  }, [params.id]);

  function getStatusBadge(email: Email) {
    if (email.openedAt) return { label: "Opened", color: "bg-green-100 text-green-700" };
    if (email.sentAt) return { label: "Sent", color: "bg-blue-100 text-blue-700" };
    if (email.status === "pending") return { label: "Pending", color: "bg-yellow-100 text-yellow-700" };
    return { label: email.status, color: "bg-gray-100 text-gray-600" };
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold text-gray-800">
          Emails
          <span className="ml-2 text-sm font-normal text-gray-500">({emails.length})</span>
        </h1>
      </div>

      {emails.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h3 className="font-display font-bold text-lg text-gray-800 mb-2">No emails yet</h3>
          <p className="text-gray-600 text-sm">Emails will appear here once generated and sent.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => {
            const status = getStatusBadge(email);
            return (
              <div key={email.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{email.subject}</p>
                    <p className="text-sm text-gray-500">
                      To: {email.leadName || email.leadEmail}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  {email.sentAt && (
                    <span>Sent {new Date(email.sentAt).toLocaleDateString()}</span>
                  )}
                  {email.openedAt && (
                    <span className="text-green-600">
                      ✓ Opened {new Date(email.openedAt).toLocaleDateString()}
                    </span>
                  )}
                  {email.clickedAt && (
                    <span className="text-primary-600">
                      ✓ Clicked {new Date(email.clickedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
