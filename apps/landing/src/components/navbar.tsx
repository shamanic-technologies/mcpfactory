"use client";

import { useState } from "react";
import Image from "next/image";
import { LinkButton } from "./link-button";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.mcpfactory.org";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-secondary-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <Image src="/logo-head.jpg" alt="MCP Factory" width={36} height={36} className="rounded-lg" />
          <span className="font-display font-bold text-xl text-primary-600 hidden sm:inline">MCP Factory</span>
          <span className="font-display font-bold text-lg text-primary-600 sm:hidden">MCP</span>
        </a>
        
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://docs.mcpfactory.org"
            className="text-gray-600 hover:text-primary-600 text-sm transition"
          >
            Docs
          </a>
          <a
            href="https://github.com/shamanic-technologies/mcpfactory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-primary-600 text-sm transition"
          >
            GitHub
          </a>
          <a
            href={`${DASHBOARD_URL}/sign-in`}
            className="text-gray-600 hover:text-primary-600 text-sm font-medium transition"
          >
            Sign In
          </a>
          <LinkButton
            href={`${DASHBOARD_URL}/sign-up`}
            className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-600 shadow-md hover:shadow-lg"
          >
            Get Started
          </LinkButton>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-2">
          <LinkButton
            href={`${DASHBOARD_URL}/sign-up`}
            className="bg-primary-500 text-white px-3 py-1.5 rounded-full text-sm font-medium"
          >
            Start
          </LinkButton>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            <a 
              href="https://docs.mcpfactory.org" 
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Docs
            </a>
            <a 
              href="https://github.com/shamanic-technologies/mcpfactory"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              GitHub
            </a>
            <a 
              href={`${DASHBOARD_URL}/sign-in`}
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Sign In
            </a>
            <div className="pt-2 border-t border-gray-100">
              <LinkButton
                href={`${DASHBOARD_URL}/sign-up`}
                className="w-full bg-primary-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-600 text-center block"
              >
                Get Started Free
              </LinkButton>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
