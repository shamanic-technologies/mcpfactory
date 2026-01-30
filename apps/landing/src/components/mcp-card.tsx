const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.mcpfactory.org";

interface McpCardProps {
  name: string;
  package: string;
  description: string;
  freeQuota: string;
  isAvailable: boolean;
}

export function McpCard({ name, package: pkg, description, freeQuota, isAvailable }: McpCardProps) {
  return (
    <div className={`bg-white rounded-xl border p-6 hover:shadow-lg transition ${
      isAvailable ? "border-primary-200 ring-2 ring-primary-100" : "border-gray-200"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg">{name}</h3>
        {isAvailable ? (
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-medium">
            Available
          </span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
            Coming Soon
          </span>
        )}
      </div>
      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded block mb-3 overflow-hidden text-ellipsis">
        {pkg}
      </code>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-primary-600 font-medium">
          Free: {freeQuota}
        </span>
        {isAvailable ? (
          <a
            href={`${DASHBOARD_URL}/sign-up`}
            className="text-sm bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 transition font-medium"
          >
            Get Started
          </a>
        ) : (
          <a
            href="#waitlist"
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Join Waitlist →
          </a>
        )}
      </div>
    </div>
  );
}
