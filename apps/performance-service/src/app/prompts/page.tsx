import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  title: "Prompt Leaderboard — MCP Factory Performance",
  description: "Coming soon: compare prompt versions and see which ones generate the most effective emails.",
};

export default function PromptsPage() {
  return (
    <main className="min-h-screen bg-white">
      <ComingSoon
        title="Prompt Leaderboard"
        description="We're building prompt versioning to track how different email generation prompts perform over time. You'll be able to see which prompt versions produce the highest open rates, reply rates, and conversions."
      />
    </main>
  );
}
