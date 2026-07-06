"use client";

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

  const links = [
    { href: "/", label: "Senarai Surat" },
    { href: "/tugasan-saya", label: "Tugasan Saya" },
    ...(role === "ADMIN"
      ? [{ href: "/pengguna", label: "Pengurusan Pengguna" }]
      : []),
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-slate-900">
            Surat Fisioterapi HTA
          </Link>
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
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            {name} <span className="text-slate-400">({role === "ADMIN" ? "Admin" : "Staf"})</span>
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            Log Keluar
          </button>
        </div>
      </div>
    </nav>
  );
}
