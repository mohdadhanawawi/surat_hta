"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, Card } from "@/components/ui";

interface TindakanData {
  id: string;
  arahan: string;
  status: string;
  tarikhAkhir: Date | string | null;
  catatanStaff: string | null;
  assignedTo: { id: string; name: string };
  assignedBy: { id: string; name: string };
}

export function TindakanItem({
  tindakan,
  currentUserId,
  currentUserRole,
}: {
  tindakan: TindakanData;
  currentUserId: string;
  currentUserRole: "ADMIN" | "STAFF";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [catatan, setCatatan] = useState(tindakan.catatanStaff ?? "");

  const canUpdate =
    currentUserRole === "ADMIN" || tindakan.assignedTo.id === currentUserId;

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/tindakan/${tindakan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveCatatan() {
    setLoading(true);
    try {
      await fetch(`/api/tindakan/${tindakan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatanStaff: catatan }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Padam tugasan tindakan ini?")) return;
    setLoading(true);
    try {
      await fetch(`/api/tindakan/${tindakan.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {tindakan.arahan}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Ditugaskan kepada <strong>{tindakan.assignedTo.name}</strong> oleh{" "}
            {tindakan.assignedBy.name}
            {tindakan.tarikhAkhir && (
              <>
                {" "}
                &middot; Tarikh akhir:{" "}
                {new Intl.DateTimeFormat("ms-MY").format(
                  new Date(tindakan.tarikhAkhir)
                )}
              </>
            )}
          </p>
        </div>
        <StatusBadge status={tindakan.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canUpdate && (
          <select
            disabled={loading}
            value={tindakan.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="BELUM_MULA">Belum Mula</option>
            <option value="DALAM_TINDAKAN">Dalam Tindakan</option>
            <option value="SELESAI">Selesai</option>
          </select>
        )}
        {currentUserRole === "ADMIN" && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Padam
          </button>
        )}
      </div>

      {canUpdate && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Catatan tindakan..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <button
            onClick={saveCatatan}
            disabled={loading}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Simpan
          </button>
        </div>
      )}
      {!canUpdate && tindakan.catatanStaff && (
        <p className="mt-2 text-xs text-slate-500">
          Catatan: {tindakan.catatanStaff}
        </p>
      )}
    </Card>
  );
}
