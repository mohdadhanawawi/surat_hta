import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge, Card } from "@/components/ui";

export default async function TugasanSayaPage() {
  const user = await requireUser();

  const tindakan = await prisma.tindakan.findMany({
    where: { assignedToId: user.userId },
    include: {
      surat: { select: { id: true, tajuk: true, noRujukan: true } },
      assignedBy: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { tarikhAkhir: "asc" }],
  });

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-slate-900">
        Tugasan Saya
      </h1>

      <div className="space-y-3">
        {tindakan.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/surat/${t.surat.id}`}
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  {t.surat.tajuk}
                </Link>
                <p className="mt-1 text-sm text-slate-700">{t.arahan}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Ditugaskan oleh {t.assignedBy.name}
                  {t.tarikhAkhir && (
                    <>
                      {" "}
                      &middot; Tarikh akhir:{" "}
                      {new Intl.DateTimeFormat("ms-MY").format(t.tarikhAkhir)}
                    </>
                  )}
                </p>
              </div>
              <StatusBadge status={t.status} />
            </div>
          </Card>
        ))}
        {tindakan.length === 0 && (
          <p className="text-sm text-slate-400">
            Tiada tindakan ditugaskan kepada anda buat masa ini.
          </p>
        )}
      </div>
    </div>
  );
}
