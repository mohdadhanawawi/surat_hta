import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { resolveUploadPath, mimeTypeFromFileName } from "@/lib/storage";

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
    const mime = mimeTypeFromFileName(surat.fileStoredName);

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
