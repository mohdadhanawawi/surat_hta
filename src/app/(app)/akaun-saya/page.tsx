import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/labels";
import { ChangePasswordForm } from "./form";

export default async function AkaunSayaPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { email: true },
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Akaun Saya</h1>

      <Card className="p-4 text-sm">
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-slate-500">Nama</dt>
            <dd className="text-slate-900">{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Username</dt>
            <dd className="text-slate-900">{user.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Emel</dt>
            <dd className="text-slate-900">{dbUser?.email ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Peranan</dt>
            <dd className="text-slate-900">{ROLE_LABEL[user.role]}</dd>
          </div>
        </dl>
        {!dbUser?.email && (
          <p className="mt-3 text-xs text-slate-400">
            Emel belum direkodkan. Hubungi admin untuk tambah emel supaya
            anda terima notifikasi bila ditugaskan tindakan.
          </p>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Tukar Kata Laluan
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
