"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

const NAV_LINKS = [
  { href: "/accounts", label: "Accounts" },
  { href: "/deals", label: "Deals (Opportunities)" },
  { href: "/quotes", label: "Quotes" },
  { href: "/leads", label: "Leads" },
];

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm md:hidden"
        onClick={() => setOpen((current) => !current)}
      >
        Menu
      </button>

      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/90 p-4 backdrop-blur transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 mt-12 md:mt-0">
          <p className="text-xs uppercase tracking-widest text-slate-500">Sales Management</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Portal</h1>
        </div>
        <nav className="space-y-2">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={classNames(
                  "block rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open ? <div className="fixed inset-0 z-30 bg-slate-900/20 md:hidden" onClick={() => setOpen(false)} /> : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
            <input
              type="search"
              placeholder="Global search (placeholder)"
              className="w-full max-w-xl rounded-md border border-slate-300 bg-white px-4 py-2 text-sm outline-none ring-brand-500 transition focus:ring"
            />
            <div className="relative">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                onClick={() => setShowUserMenu((current) => !current)}
              >
                {user?.name || user?.email || "User"}
              </button>
              {showUserMenu ? (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                  <p className="px-2 py-1 text-xs text-slate-500">{user?.email || "No email claim"}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      void logout();
                    }}
                    className="mt-1 w-full rounded px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
