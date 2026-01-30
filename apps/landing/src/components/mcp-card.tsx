interface McpCardProps {
  name: string;
  package: string;
  description: string;
  freeQuota: string;
  eta: string;
}

export function McpCard({ name, package: pkg, description, freeQuota, eta }: McpCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg">{name}</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
          {eta}
        </span>
      </div>
      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded block mb-3 overflow-hidden text-ellipsis">
        {pkg}
      </code>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-primary-600 font-medium">
          Free: {freeQuota}
        </span>
        <a
          href={`https://github.com/shamanic-technologies/mcpfactory/tree/main/packages/${pkg.split("/")[1]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-900 transition"
        >
          View →
        </a>
      </div>
    </div>
  );
}
