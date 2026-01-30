import Link from "next/link";

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

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your account and API keys.</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {SETTINGS_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-200 hover:shadow-sm transition group"
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl">{item.icon}</div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 group-hover:text-primary-600 transition">
                  {item.name}
                </h3>
                <p className="text-gray-500 text-sm">{item.description}</p>
              </div>
              <div className="text-gray-400 group-hover:text-primary-500 transition">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
