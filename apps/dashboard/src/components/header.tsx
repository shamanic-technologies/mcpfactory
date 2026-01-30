"use client";

import Image from "next/image";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="MCP Factory" width={32} height={32} className="rounded-md" />
            <span className="font-display font-bold text-xl text-primary-600">MCP Factory</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://docs.mcpfactory.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-primary-600 transition"
          >
            Docs
          </a>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 transition"
            >
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.firstName || "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {user?.firstName?.[0] || "U"}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-700 font-medium hidden sm:block">
                {user?.firstName || "User"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition ${menuOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <button
                  onClick={() => signOut({ redirectUrl: "/sign-in" })}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
