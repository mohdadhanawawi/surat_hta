import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth";
import { deleteUploadedFile } from "@/lib/storage";

const updateSuratSchema = z.object({
  tajuk: z.string().min(1).optional(),
  noRujukan: z.string().optional(),
  tarikhSurat: z.string().optional(),
  sumber: z.string().optional(),
  kategori: z.string().optional(),
  link: z.string().url().optional().or(z.literal("")),
  catatan: z.string().optional(),
  status: z.enum(["BELUM_MULA", "DALAM_TINDAKAN", "SELESAI"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
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

  if (!surat) {
    return NextResponse.json({ error: "Surat tidak dijumpai." }, { status: 404 });
  }

  return NextResponse.json({ surat });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateSuratSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak sah." },
      { status: 400 }
    );
  }

  const { tarikhSurat, ...rest } = parsed.data;

  const surat = await prisma.surat.update({
    where: { id },
    data: {
      ...rest,
      ...(tarikhSurat ? { tarikhSurat: new Date(tarikhSurat) } : {}),
    },
  });

  return NextResponse.json({ surat });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const surat = await prisma.surat.findUnique({ where: { id } });
  if (!surat) {
    return NextResponse.json({ error: "Surat tidak dijumpai." }, { status: 404 });
  }

  await prisma.surat.delete({ where: { id } });

  if (surat.fileStoredName) {
    await deleteUploadedFile(surat.fileStoredName);
  }

  return NextResponse.json({ ok: true });
}
