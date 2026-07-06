import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge, Card } from "@/components/ui";
import { AssignTindakanForm } from "./assign-form";
import { TindakanItem } from "./tindakan-item";
import { DeleteSuratButton } from "./delete-button";

export default async function SuratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const surat = await prisma.surat.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      tindakan: {
        include: {
          assignedTo: { select: { id: true, name: true } },
          assignedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!surat) notFound();

  const staffList =
    user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">{surat.tajuk}</h1>
          <StatusBadge status={surat.status} />
        </div>
        <p className="text-sm text-slate-500">
          Dicipta oleh {surat.createdBy.name} pada{" "}
          {new Intl.DateTimeFormat("ms-MY", {
            dateStyle: "medium",
          }).format(surat.createdAt)}
        </p>
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">No. Rujukan</dt>
            <dd className="mt-0.5 text-slate-900">{surat.noRujukan ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tarikh Surat</dt>
            <dd className="mt-0.5 text-slate-900">
              {new Intl.DateTimeFormat("ms-MY").format(surat.tarikhSurat)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Sumber</dt>
            <dd className="mt-0.5 text-slate-900">{surat.sumber ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Kategori</dt>
            <dd className="mt-0.5 text-slate-900">{surat.kategori ?? "-"}</dd>
          </div>
          {surat.catatan && (
            <div className="col-span-2">
              <dt className="text-slate-500">Catatan</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">
                {surat.catatan}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-4 border-t border-slate-100 pt-4">
          {surat.fileStoredName ? (
            <a
              href={`/api/surat/${surat.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              📄 Lihat / Muat Turun Fail ({surat.fileName})
            </a>
          ) : surat.link ? (
            <a
              href={surat.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              🔗 Buka Pautan Surat
            </a>
          ) : null}
        </div>

        {user.role === "ADMIN" && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <DeleteSuratButton suratId={surat.id} />
          </div>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Tindakan ({surat.tindakan.length})
        </h2>

        <div className="space-y-3">
          {surat.tindakan.map((t) => (
            <TindakanItem
              key={t.id}
              tindakan={t}
              currentUserId={user.userId}
              currentUserRole={user.role}
            />
          ))}
          {surat.tindakan.length === 0 && (
            <p className="text-sm text-slate-400">
              Belum ada tindakan ditugaskan.
            </p>
          )}
        </div>

        {user.role === "ADMIN" && (
          <div className="mt-4">
            <AssignTindakanForm suratId={surat.id} staffList={staffList} />
          </div>
        )}
      </div>
    </div>
  );
}
