import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { resolveUploadPath, mimeTypeFromFileName } from "@/lib/storage";
import { janaRingkasanSurat, GeminiError } from "@/lib/gemini";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
  const { id } = await params;

  const surat = await prisma.surat.findUnique({ where: { id } });
  if (!surat) {
    return NextResponse.json({ error: "Surat tidak dijumpai." }, { status: 404 });
  }

  if (!surat.fileStoredName) {
    return NextResponse.json(
      { error: "Ringkasan AI hanya tersedia untuk surat yang dimuat naik sebagai fail." },
      { status: 400 }
    );
  }

  try {
    const filePath = resolveUploadPath(surat.fileStoredName);
    const buffer = await readFile(filePath);
    const mime = mimeTypeFromFileName(surat.fileStoredName);

    const ringkasan = await janaRingkasanSurat(buffer, mime);

    const updated = await prisma.surat.update({
      where: { id },
      data: { ringkasanAI: ringkasan, ringkasanDijanaPada: new Date() },
    });

    return NextResponse.json({
      ringkasanAI: updated.ringkasanAI,
      ringkasanDijanaPada: updated.ringkasanDijanaPada,
    });
  } catch (err) {
    const message =
      err instanceof GeminiError
        ? err.message
        : "Gagal menjana ringkasan. Sila cuba lagi.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
