import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth";

const updateTindakanSchema = z.object({
  status: z.enum(["BELUM_MULA", "DALAM_TINDAKAN", "SELESAI"]).optional(),
  catatanStaff: z.string().optional(),
  arahan: z.string().min(1).optional(),
  tarikhAkhir: z.string().nullable().optional(),
});

async function syncSuratStatus(suratId: string) {
  const semua = await prisma.tindakan.findMany({ where: { suratId } });
  if (semua.length === 0) {
    await prisma.surat.update({
      where: { id: suratId },
      data: { status: "BELUM_MULA" },
    });
    return;
  }

  const semuaSelesai = semua.every((t) => t.status === "SELESAI");
  const adaDalamTindakan = semua.some(
    (t) => t.status === "DALAM_TINDAKAN" || t.status === "SELESAI"
  );

  await prisma.surat.update({
    where: { id: suratId },
    data: {
      status: semuaSelesai
        ? "SELESAI"
        : adaDalamTindakan
          ? "DALAM_TINDAKAN"
          : "BELUM_MULA",
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;

  const tindakan = await prisma.tindakan.findUnique({ where: { id } });
  if (!tindakan) {
    return NextResponse.json({ error: "Tindakan tidak dijumpai." }, { status: 404 });
  }

  const isOwner = tindakan.assignedToId === user.userId;
  if (user.role !== "ADMIN" && !isOwner) {
    return NextResponse.json({ error: "Tiada kebenaran." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTindakanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak sah." },
      { status: 400 }
    );
  }

  // Staf biasa hanya boleh kemaskini status & catatan mereka sendiri.
  const data: Record<string, unknown> = {};
  if (parsed.data.status) {
    data.status = parsed.data.status;
    data.completedAt = parsed.data.status === "SELESAI" ? new Date() : null;
  }
  if (parsed.data.catatanStaff !== undefined) {
    data.catatanStaff = parsed.data.catatanStaff;
  }
  if (user.role === "ADMIN") {
    if (parsed.data.arahan) data.arahan = parsed.data.arahan;
    if (parsed.data.tarikhAkhir !== undefined) {
      data.tarikhAkhir = parsed.data.tarikhAkhir
        ? new Date(parsed.data.tarikhAkhir)
        : null;
    }
  }

  const updated = await prisma.tindakan.update({ where: { id }, data });
  await syncSuratStatus(tindakan.suratId);

  return NextResponse.json({ tindakan: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const tindakan = await prisma.tindakan.findUnique({ where: { id } });
  if (!tindakan) {
    return NextResponse.json({ error: "Tindakan tidak dijumpai." }, { status: 404 });
  }

  await prisma.tindakan.delete({ where: { id } });
  await syncSuratStatus(tindakan.suratId);

  return NextResponse.json({ ok: true });
}
