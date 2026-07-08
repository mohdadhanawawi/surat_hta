import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hantarEmelTindakan } from "@/lib/mailer";

const createTindakanSchema = z.object({
  suratId: z.string().min(1),
  assignedToId: z.string().min(1),
  arahan: z.string().min(1, "Sila nyatakan arahan tindakan."),
  tarikhAkhir: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await requireAdmin();

  const body = await request.json().catch(() => null);
  const parsed = createTindakanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak sah." },
      { status: 400 }
    );
  }

  const { suratId, assignedToId, arahan, tarikhAkhir } = parsed.data;

  const surat = await prisma.surat.findUnique({ where: { id: suratId } });
  if (!surat) {
    return NextResponse.json({ error: "Surat tidak dijumpai." }, { status: 404 });
  }

  const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
  if (!assignee || !assignee.isActive) {
    return NextResponse.json(
      { error: "Staf yang dipilih tidak sah." },
      { status: 400 }
    );
  }

  const tindakan = await prisma.tindakan.create({
    data: {
      suratId,
      assignedToId,
      assignedById: user.userId,
      arahan,
      tarikhAkhir: tarikhAkhir ? new Date(tarikhAkhir) : undefined,
    },
  });

  if (surat.status === "BELUM_MULA") {
    await prisma.surat.update({
      where: { id: suratId },
      data: { status: "DALAM_TINDAKAN" },
    });
  }

  let emel: { sent: boolean; error?: string } | null = null;
  if (assignee.email) {
    emel = await hantarEmelTindakan({
      to: assignee.email,
      namaStaf: assignee.name,
      namaPemberi: user.name,
      suratTajuk: surat.tajuk,
      suratId: surat.id,
      arahan,
      tarikhAkhir: tindakan.tarikhAkhir,
    });
    console.log(
      `[emel-tindakan] tindakan=${tindakan.id} to=${assignee.email} sent=${emel.sent}` +
        (emel.error ? ` error=${emel.error}` : "")
    );
  } else {
    console.log(
      `[emel-tindakan] tindakan=${tindakan.id} dilangkau: staf ${assignee.name} tiada emel`
    );
  }

  return NextResponse.json({ tindakan, emel }, { status: 201 });
}
