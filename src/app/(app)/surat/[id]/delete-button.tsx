"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteSuratButton({ suratId }: { suratId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Padam surat ini beserta semua tindakan yang berkaitan? Tindakan ini tidak boleh dibuat asal."
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/surat/${suratId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-600 hover:underline"
    >
      {loading ? "Memadam..." : "Padam Surat"}
    </button>
  );
}
