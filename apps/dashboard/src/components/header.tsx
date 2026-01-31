"use client";

import Image from "next/image";
import Link from "next/link";
import { useClerk, useUser, useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setOrgMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOrgSwitch = (orgId: string) => {
    if (setActive) {
      setActive({ organization: orgId });
    }
    setOrgMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-head.jpg" alt="MCP Factory" width={32} height={32} className="rounded-md" />
            <span className="font-display font-bold text-xl text-primary-600">MCP Factory</span>
          </Link>

          {/* Organization Selector */}
          <div className="relative ml-4" ref={orgMenuRef}>
            <button
              onClick={() => setOrgMenuOpen(!orgMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition text-sm"
            >
              <div className="w-5 h-5 bg-primary-100 rounded flex items-center justify-center">
                <span className="text-primary-600 font-medium text-xs">
                  {organization?.name?.[0] || "O"}
                </span>
              </div>
              <span className="text-gray-700 font-medium max-w-[120px] truncate">
                {organization?.name || "Select org"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition ${orgMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {orgMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-medium">Your organizations</p>
                </div>
                {userMemberships?.data?.map((membership) => (
                  <button
                    key={membership.organization.id}
                    onClick={() => handleOrgSwitch(membership.organization.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${
                      organization?.id === membership.organization.id
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-medium text-xs">
                        {membership.organization.name[0]}
                      </span>
                    </div>
                    <span className="truncate">{membership.organization.name}</span>
                    {organization?.id === membership.organization.id && (
                      <svg className="w-4 h-4 text-primary-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    disabled
                    className="w-full text-left px-3 py-2 text-sm text-gray-400 flex items-center gap-2 cursor-not-allowed"
                  >
                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span>Create new org</span>
                    <span className="ml-auto text-xs bg-gray-100 px-1.5 py-0.5 rounded">Soon</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
