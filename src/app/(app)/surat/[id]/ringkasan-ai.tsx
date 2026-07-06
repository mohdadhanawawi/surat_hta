"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";

export function RingkasanAI({
  suratId,
  adaFail,
  ringkasanAwal,
  dijanaPadaAwal,
}: {
  suratId: string;
  adaFail: boolean;
  ringkasanAwal: string | null;
  dijanaPadaAwal: Date | string | null;
}) {
  const router = useRouter();
  const [ringkasan, setRingkasan] = useState(ringkasanAwal);
  const [dijanaPada, setDijanaPada] = useState(dijanaPadaAwal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!adaFail) return null;

  async function janaRingkasan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/surat/${suratId}/ringkasan`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menjana ringkasan.");
        return;
      }
      setRingkasan(data.ringkasanAI);
      setDijanaPada(data.ringkasanDijanaPada);
      router.refresh();
    } catch {
      setError("Ralat rangkaian. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Ringkasan AI
        </h2>
        <button
          onClick={janaRingkasan}
          disabled={loading}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading
            ? "Menjana..."
            : ringkasan
              ? "Jana Semula"
              : "Jana Ringkasan AI"}
        </button>
      </div>

      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {ringkasan ? (
        <>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {ringkasan}
          </p>
          {dijanaPada && (
            <p className="mt-2 text-xs text-slate-400">
              Dijana pada{" "}
              {new Intl.DateTimeFormat("ms-MY", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(dijanaPada))}{" "}
              &middot; Sila semak ketepatan ringkasan ini berbanding surat
              asal.
            </p>
          )}
        </>
      ) : (
        !loading && (
          <p className="mt-2 text-sm text-slate-400">
            Belum ada ringkasan. Klik &quot;Jana Ringkasan AI&quot; untuk
            menjana ringkasan automatik dari fail surat ini.
          </p>
        )
      )}
    </Card>
  );
}
