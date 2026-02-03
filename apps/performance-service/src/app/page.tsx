import Link from "next/link";
import { URLS } from "@mcpfactory/content";
import { fetchLeaderboard } from "@/lib/fetch-leaderboard";
import { HeroStatsSection } from "@/components/hero-stats";

export const revalidate = 3600;

export default async function HomePage() {
  const data = await fetchLeaderboard();

  return (
    <main className="min-h-screen">
      {data?.hero ? (
        <HeroStatsSection hero={data.hero} />
      ) : (
        <section className="py-16 px-4 gradient-bg">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-gray-800">
              Real Performance, <span className="gradient-text">Real Data</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Performance data will appear here as campaigns run. Check back soon.
            </p>
          </div>
        </section>
      )}

      {/* Leaderboard links */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-8 text-gray-800">
            Explore the Data
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/brands"
              className="group bg-gradient-to-br from-primary-50 to-white rounded-2xl p-6 border border-primary-100 hover:border-primary-300 transition hover:shadow-lg"
            >
              <h3 className="font-display text-lg font-bold mb-2 text-gray-800 group-hover:text-primary-600">
                By Brand
              </h3>
              <p className="text-sm text-gray-600">
                See how each client&apos;s campaigns perform. Open rates, click rates, reply rates, and cost per action.
              </p>
              {data?.brands && (
                <p className="text-xs text-gray-400 mt-3">
                  {data.brands.length} brand{data.brands.length !== 1 ? "s" : ""}
                </p>
              )}
            </Link>

            <Link
              href="/models"
              className="group bg-gradient-to-br from-accent-50 to-white rounded-2xl p-6 border border-accent-100 hover:border-accent-300 transition hover:shadow-lg"
            >
              <h3 className="font-display text-lg font-bold mb-2 text-gray-800 group-hover:text-accent-600">
                By Model
              </h3>
              <p className="text-sm text-gray-600">
                Compare AI models head-to-head. Which model writes the most effective cold emails?
              </p>
              {data?.models && (
                <p className="text-xs text-gray-400 mt-3">
                  {data.models.length} model{data.models.length !== 1 ? "s" : ""}
                </p>
              )}
            </Link>

            <Link
              href="/prompts"
              className="group bg-gradient-to-br from-secondary-50 to-white rounded-2xl p-6 border border-secondary-100 hover:border-secondary-300 transition hover:shadow-lg"
            >
              <h3 className="font-display text-lg font-bold mb-2 text-gray-800 group-hover:text-secondary-600">
                By Prompt
              </h3>
              <p className="text-sm text-gray-600">
                Track how different prompt versions perform over time.
              </p>
              <p className="text-xs text-secondary-500 mt-3 font-medium">Coming soon</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Why transparency */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4 text-gray-800">
            Why We Publish Everything
          </h2>
          <p className="text-gray-600 mb-6">
            Most outreach platforms hide their real numbers. We don&apos;t.
            Every campaign that runs through MCP Factory contributes to these public leaderboards.
            This means you can make informed decisions based on real data, not marketing claims.
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <a
              href={URLS.signUp}
              className="px-6 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition font-medium"
            >
              Start a Campaign
            </a>
            <a
              href={URLS.docs}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-full hover:border-primary-300 transition font-medium"
            >
              Read the Docs
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
