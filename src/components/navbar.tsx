"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar({
  name,
  role,
}: {
  name: string;
  role: "ADMIN" | "STAFF";
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Senarai Surat" },
    { href: "/tugasan-saya", label: "Tugasan Saya" },
    ...(role === "ADMIN"
      ? [{ href: "/pengguna", label: "Pengurusan Pengguna" }]
      : []),
    { href: "/akaun-saya", label: "Akaun Saya" },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-semibold text-slate-900">
          Surat Fisioterapi HTA
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <div className="flex gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
                    ? "font-medium text-teal-700"
                    : "text-slate-600 hover:text-slate-900"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>
              {name}{" "}
              <span className="text-slate-400">
                ({role === "ADMIN" ? "Admin" : "Staf"})
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Log Keluar
            </button>
          </div>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Buka menu"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 md:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={
                  "rounded-md px-2 py-2 " +
                  (pathname === link.href
                    ? "font-medium text-teal-700"
                    : "text-slate-600 hover:bg-slate-50")
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
            <span>
              {name}{" "}
              <span className="text-slate-400">
                ({role === "ADMIN" ? "Admin" : "Staf"})
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Log Keluar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
