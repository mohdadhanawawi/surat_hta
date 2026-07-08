"use client";

import { useRouter } from "next/navigation";
import { KATEGORI_SURAT } from "@/lib/labels";

export function FilterForm({
  q,
  status,
  kategori,
  tarikhDari,
  tarikhHingga,
}: {
  q?: string;
  status?: string;
  kategori?: string;
  tarikhDari?: string;
  tarikhHingga?: string;
}) {
  const router = useRouter();

  function submitForm(form: HTMLFormElement) {
    const formData = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (value) params.set(key, value.toString());
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitForm(e.currentTarget);
      }}
      onChange={(e) => submitForm(e.currentTarget)}
      className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="w-full sm:w-64">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Cari
        </label>
        <input
          type="text"
          name="q"
          placeholder="Cari tajuk, no. rujukan, sumber..."
          defaultValue={q}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Status
        </label>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-auto"
        >
          <option value="">Semua Status</option>
          <option value="BELUM_MULA">Belum Mula</option>
          <option value="DALAM_TINDAKAN">Dalam Tindakan</option>
          <option value="SELESAI">Selesai</option>
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Kategori
        </label>
        <select
          name="kategori"
          defaultValue={kategori ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-auto"
        >
          <option value="">Semua Kategori</option>
          {KATEGORI_SURAT.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Tarikh Dari
        </label>
        <input
          type="date"
          name="tarikhDari"
          defaultValue={tarikhDari}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-auto"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Tarikh Hingga
        </label>
        <input
          type="date"
          name="tarikhHingga"
          defaultValue={tarikhHingga}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-auto"
        />
      </div>
      <div className="flex w-full gap-2 sm:w-auto">
        <button
          type="submit"
          className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 sm:flex-none"
        >
          Tapis
        </button>
        {(q || status || kategori || tarikhDari || tarikhHingga) && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 rounded-md px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 sm:flex-none"
          >
            Kosongkan
          </button>
        )}
      </div>
    </form>
  );
}
