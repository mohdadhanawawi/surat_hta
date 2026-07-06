import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { resolveUploadPath } from "@/lib/storage";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
  const { id } = await params;

  const surat = await prisma.surat.findUnique({ where: { id } });
  if (!surat || !surat.fileStoredName) {
    return NextResponse.json({ error: "Fail tidak dijumpai." }, { status: 404 });
  }

  try {
    const filePath = resolveUploadPath(surat.fileStoredName);
    const buffer = await readFile(filePath);
    const ext = path.extname(surat.fileStoredName).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          surat.fileName ?? surat.fileStoredName
        )}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fail tidak dijumpai." }, { status: 404 });
  }
}
