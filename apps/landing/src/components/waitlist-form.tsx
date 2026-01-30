"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    // TODO: Connect to actual waitlist API
    // For now, just simulate success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <div className="text-primary-600 text-4xl mb-2">✓</div>
        <p className="font-bold text-gray-900">You're on the list!</p>
        <p className="text-gray-600 text-sm">We'll notify you when we launch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        required
        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50"
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </button>
    </form>
  );
}
