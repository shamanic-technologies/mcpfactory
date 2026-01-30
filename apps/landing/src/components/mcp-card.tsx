const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.mcpfactory.org";

interface McpCardProps {
  name: string;
  package: string;
  description: string;
  freeQuota: string;
  isAvailable: boolean;
}

export function McpCard({ name, package: pkg, description, freeQuota, isAvailable }: McpCardProps) {
  return (
    <div className={`bg-white rounded-2xl border p-6 hover:shadow-xl transition-all duration-300 ${
      isAvailable 
        ? "border-primary-200 ring-2 ring-primary-100 hover:ring-primary-200" 
        : "border-gray-200 hover:border-secondary-200"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display font-bold text-lg text-gray-800">{name}</h3>
        {isAvailable ? (
          <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-medium border border-primary-200">
            Available
          </span>
        ) : (
          <span className="text-xs bg-secondary-100 text-secondary-600 px-2.5 py-1 rounded-full border border-secondary-200">
            Coming Soon
          </span>
        )}
      </div>
      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg block mb-3 overflow-hidden text-ellipsis">
        {pkg}
      </code>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-accent-600 font-medium">
          Free: {freeQuota}
        </span>
        {isAvailable ? (
          <a
            href={`${DASHBOARD_URL}/sign-up`}
            className="text-sm bg-primary-500 text-white px-4 py-1.5 rounded-full hover:bg-primary-600 transition font-medium shadow-sm hover:shadow-md"
          >
            Get Started
          </a>
        ) : (
          <a
            href="#waitlist"
            className="text-sm text-secondary-500 hover:text-secondary-700 transition font-medium"
          >
            Join Waitlist →
          </a>
        )}
      </div>
    </div>
  );
}
