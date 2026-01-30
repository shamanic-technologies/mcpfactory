import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

const SETTINGS_NAV = [
  {
    name: "BYOK Keys",
    href: "/settings/keys",
    description: "Configure your API keys for OpenAI, Apollo, Resend, etc.",
    icon: "🔑",
  },
  {
    name: "API Key",
    href: "/settings/api",
    description: "View and regenerate your MCP Factory API key.",
    icon: "🔐",
  },
];

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-secondary-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="MCP Factory" width={32} height={32} className="rounded-md" />
              <span className="font-display font-bold text-xl text-primary-600">MCP Factory</span>
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Settings</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-primary-600 text-sm transition">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600">Manage your account and API keys.</p>
        </div>

        <div className="grid gap-4">
          {SETTINGS_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-primary-200 hover:shadow-md transition group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg text-gray-800 group-hover:text-primary-600 transition">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                <div className="text-gray-400 group-hover:text-primary-500 transition">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
