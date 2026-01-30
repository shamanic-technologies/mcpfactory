"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    // TODO: Connect to actual waitlist API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <div className="bg-accent-50 border border-accent-200 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="text-accent-700 font-medium">You&apos;re on the list!</p>
        <p className="text-accent-600 text-sm">We&apos;ll notify you when we launch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition shadow-sm"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition disabled:opacity-50 shadow-md hover:shadow-lg"
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </button>
    </form>
  );
}
