import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge, Card } from "@/components/ui";
import { KATEGORI_SURAT } from "@/lib/labels";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kategori?: string; q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const surat = await prisma.surat.findMany({
    where: {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.kategori ? { kategori: params.kategori } : {}),
      ...(params.q
        ? {
            OR: [
              { tajuk: { contains: params.q } },
              { noRujukan: { contains: params.q } },
              { sumber: { contains: params.q } },
            ],
          }
        : {}),
    },
    include: {
      tindakan: {
        include: { assignedTo: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Senarai Surat</h1>
          <p className="text-sm text-slate-500">
            Pengurusan surat masuk Unit Fisioterapi HTA
          </p>
        </div>
        {user.role === "ADMIN" && (
          <Link
            href="/surat/new"
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            + Surat Baru
          </Link>
        )}
      </div>

      <form className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          name="q"
          placeholder="Cari tajuk, no. rujukan, sumber..."
          defaultValue={params.q}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-64"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-auto"
        >
          <option value="">Semua Status</option>
          <option value="BELUM_MULA">Belum Mula</option>
          <option value="DALAM_TINDAKAN">Dalam Tindakan</option>
          <option value="SELESAI">Selesai</option>
        </select>
        <select
          name="kategori"
          defaultValue={params.kategori ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:w-auto"
        >
          <option value="">Semua Kategori</option>
          {KATEGORI_SURAT.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          Tapis
        </button>
      </form>

      {/* Senarai kad untuk skrin mobile */}
      <div className="space-y-3 md:hidden">
        {surat.map((s) => (
          <Card key={s.id} className="p-4">
            <Link
              href={`/surat/${s.id}`}
              className="font-medium text-teal-700 hover:underline"
            >
              {s.tajuk}
            </Link>
            {s.noRujukan && (
              <div className="text-xs text-slate-500">{s.noRujukan}</div>
            )}
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
              <div>
                <dt className="text-slate-400">Sumber</dt>
                <dd>{s.sumber ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Kategori</dt>
                <dd>{s.kategori ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Tarikh Surat</dt>
                <dd>{new Intl.DateTimeFormat("ms-MY").format(s.tarikhSurat)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Ditugaskan Kepada</dt>
                <dd>
                  {s.tindakan.length > 0
                    ? [...new Set(s.tindakan.map((t) => t.assignedTo.name))].join(
                        ", "
                      )
                    : "-"}
                </dd>
              </div>
            </dl>
            <div className="mt-2">
              <StatusBadge status={s.status} />
            </div>
          </Card>
        ))}
        {surat.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            Tiada surat dijumpai.
          </p>
        )}
      </div>

      {/* Jadual untuk skrin desktop */}
      <Card className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tajuk Surat</th>
              <th className="px-4 py-3">Sumber</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Tarikh Surat</th>
              <th className="px-4 py-3">Ditugaskan Kepada</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {surat.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/surat/${s.id}`}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    {s.tajuk}
                  </Link>
                  {s.noRujukan && (
                    <div className="text-xs text-slate-500">{s.noRujukan}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.sumber ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{s.kategori ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Intl.DateTimeFormat("ms-MY").format(s.tarikhSurat)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {s.tindakan.length > 0
                    ? [...new Set(s.tindakan.map((t) => t.assignedTo.name))].join(
                        ", "
                      )
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
            {surat.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Tiada surat dijumpai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
