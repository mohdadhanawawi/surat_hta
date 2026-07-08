"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { KATEGORI_SURAT } from "@/lib/labels";

export function NewSuratForm({ useBlob }: { useBlob: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<"file" | "link">("file");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (sourceType === "file") {
      formData.delete("link");
    } else {
      formData.delete("file");
    }

    try {
      const file = formData.get("file");

      // Jika guna Vercel Blob, muat naik terus dari pelayar ke Blob dahulu
      // (elak had saiz badan permintaan 4.5MB pada Vercel Functions).
      if (useBlob && file instanceof File && file.size > 0) {
        const ext = file.name.includes(".")
          ? file.name.slice(file.name.lastIndexOf("."))
          : "";
        const storedName = `${crypto.randomUUID()}${ext}`;

        const blob = await upload(storedName, file, {
          access: "private",
          handleUploadUrl: "/api/surat/upload",
          contentType: file.type,
        });

        formData.delete("file");
        formData.set("fileStoredName", blob.pathname);
        formData.set("fileName", file.name);
      }

      const res = await fetch("/api/surat", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan surat.");
        return;
      }
      router.push(`/surat/${data.surat.id}`);
      router.refresh();
    } catch {
      setError("Ralat rangkaian. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Tajuk Surat *
        </label>
        <input
          name="tajuk"
          type="text"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            No. Rujukan
          </label>
          <input
            name="noRujukan"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tarikh Surat *
          </label>
          <input
            name="tarikhSurat"
            type="date"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Sumber / Pengirim
          </label>
          <input
            name="sumber"
            type="text"
            placeholder="Contoh: JKN, KKM"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Kategori
          </label>
          <select
            name="kategori"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">Pilih kategori</option>
            {KATEGORI_SURAT.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Sumber Surat *
        </label>
        <div className="mb-2 flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={sourceType === "file"}
              onChange={() => setSourceType("file")}
            />
            Muat Naik Fail
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={sourceType === "link"}
              onChange={() => setSourceType("link")}
            />
            Pautan (Link)
          </label>
        </div>

        {sourceType === "file" ? (
          <input
            name="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
          />
        ) : (
          <input
            name="link"
            type="url"
            placeholder="https://..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Catatan
        </label>
        <textarea
          name="catatan"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan Surat"}
        </button>
      </div>
    </form>
  );
}
