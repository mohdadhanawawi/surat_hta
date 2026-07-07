"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABEL } from "@/lib/labels";

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

export function UserRow({
  user,
  isSelf,
}: {
  user: UserData;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    try {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    const password = prompt(
      `Masukkan kata laluan baru untuk ${user.name} (min. 6 aksara):`
    );
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Gagal menetapkan kata laluan.");
      } else {
        alert("Kata laluan berjaya ditetapkan.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function editEmail() {
    const email = prompt(
      `Masukkan emel untuk ${user.name} (kosongkan untuk buang emel):`,
      user.email ?? ""
    );
    if (email === null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Gagal mengemaskini emel.");
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
      <td className="px-4 py-3 text-slate-600">{user.username}</td>
      <td className="px-4 py-3 text-slate-600">
        {user.email ?? <span className="text-slate-300">-</span>}
      </td>
      <td className="px-4 py-3 text-slate-600">{ROLE_LABEL[user.role]}</td>
      <td className="px-4 py-3">
        <span
          className={
            user.isActive
              ? "text-emerald-700"
              : "text-slate-400"
          }
        >
          {user.isActive ? "Aktif" : "Dinyahaktifkan"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3 text-xs">
          <button
            onClick={editEmail}
            disabled={loading}
            className="text-slate-600 hover:underline"
          >
            Edit Emel
          </button>
          {!isSelf && (
            <>
              <button
                onClick={resetPassword}
                disabled={loading}
                className="text-slate-600 hover:underline"
              >
                Tetapkan Kata Laluan
              </button>
              <button
                onClick={toggleActive}
                disabled={loading}
                className={user.isActive ? "text-red-600" : "text-teal-600"}
              >
                {user.isActive ? "Nyahaktifkan" : "Aktifkan"}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
