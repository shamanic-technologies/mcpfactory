import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">MCP Factory</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              Docs
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/shamanic-technologies/mcpfactory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            GitHub
          </a>
          <a
            href="https://mcpfactory.org"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Home
          </a>
          <a
            href="https://app.mcpfactory.org"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
          >
            Dashboard
          </a>
        </div>
      </div>
    </header>
  );
}
