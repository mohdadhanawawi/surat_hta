import { requireAdmin } from "@/lib/auth";
import { NewSuratForm } from "./form";

export default async function NewSuratPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">
        Tambah Surat Baru
      </h1>
      <NewSuratForm useBlob={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
    </div>
  );
}
