"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";

interface Email {
  id: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  leadFirstName: string;
  leadLastName: string;
  leadTitle: string;
  leadCompany: string;
  leadIndustry: string;
  clientCompanyName: string;
  createdAt: string;
}

export default function CampaignEmailsPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

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
  }, [params.id, getToken]);

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
    <div className="flex h-full">
      {/* Email List */}
      <div className={`${selectedEmail ? 'w-1/2' : 'w-full'} p-8 overflow-y-auto transition-all`}>
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
            <p className="text-gray-600 text-sm">Emails will appear here once generated.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`w-full text-left bg-white rounded-xl border p-4 hover:border-primary-300 hover:shadow-sm transition ${
                  selectedEmail?.id === email.id ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-gray-800 truncate">{email.subject}</p>
                <p className="text-sm text-gray-500 mt-1">
                  To: {email.leadFirstName} {email.leadLastName} • {email.leadCompany}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Email Detail Panel */}
      {selectedEmail && (
        <div className="w-1/2 border-l border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Email Preview</h2>
            <button
              onClick={() => setSelectedEmail(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            {/* Recipient Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">To:</span>
                  <p className="font-medium">{selectedEmail.leadFirstName} {selectedEmail.leadLastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Title:</span>
                  <p className="font-medium">{selectedEmail.leadTitle || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Company:</span>
                  <p className="font-medium">{selectedEmail.leadCompany || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Industry:</span>
                  <p className="font-medium">{selectedEmail.leadIndustry || '-'}</p>
                </div>
              </div>
            </div>

            {/* Email Content */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <p className="font-semibold text-gray-800">{selectedEmail.subject}</p>
                <p className="text-xs text-gray-500 mt-1">
                  From: {selectedEmail.clientCompanyName || 'Your Company'}
                </p>
              </div>
              <div className="p-4">
                {selectedEmail.bodyHtml ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {selectedEmail.bodyText}
                  </pre>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 text-xs text-gray-400">
              Generated: {new Date(selectedEmail.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
