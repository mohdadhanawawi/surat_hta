import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { readUploadedFile } from "@/lib/storage";

export async function GET() {
  await requireAdmin();

  const users = await prisma.user.findMany();
  const surat = await prisma.surat.findMany();
  const tindakan = await prisma.tindakan.findMany();

  const suratWithFiles = await Promise.all(
    surat.map(async (s) => {
      if (!s.fileStoredName) return { ...s, fileBase64: null };
      try {
        const buffer = await readUploadedFile(s.fileStoredName);
        return { ...s, fileBase64: buffer.toString("base64") };
      } catch {
        return { ...s, fileBase64: null };
      }
    })
  );

  const eksport = {
    dieksportPada: new Date().toISOString(),
    users,
    surat: suratWithFiles,
    tindakan,
  };

  return NextResponse.json(eksport, {
    headers: {
      "Content-Disposition": `attachment; filename="surat-hta-eksport-${Date.now()}.json"`,
    },
  });
}
