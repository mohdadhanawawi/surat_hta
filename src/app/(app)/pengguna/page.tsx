import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { NewUserForm } from "./form";
import { UserRow } from "./user-row";

export default async function PenggunaPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">
        Pengurusan Pengguna
      </h1>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Peranan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === admin.userId} />
            ))}
          </tbody>
        </table>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Tambah Pengguna Baru
        </h2>
        <NewUserForm />
      </div>
    </div>
  );
}
