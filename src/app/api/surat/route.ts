import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth";
import {
  saveUploadedFile,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_FILE_SIZE,
} from "@/lib/storage";

const ALLOWED_MIME = new Set(ALLOWED_UPLOAD_MIME_TYPES);
const MAX_FILE_SIZE = MAX_UPLOAD_FILE_SIZE;

const createSuratSchema = z.object({
  tajuk: z.string().min(1, "Tajuk surat diperlukan."),
  noRujukan: z.string().optional(),
  tarikhSurat: z.string().min(1, "Tarikh surat diperlukan."),
  sumber: z.string().optional(),
  kategori: z.string().optional(),
  link: z.string().url().optional().or(z.literal("")),
  catatan: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const kategori = searchParams.get("kategori");
  const q = searchParams.get("q");

  const surat = await prisma.surat.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(kategori ? { kategori } : {}),
      ...(q
        ? {
            OR: [
              { tajuk: { contains: q } },
              { noRujukan: { contains: q } },
              { sumber: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      createdBy: { select: { name: true } },
      tindakan: {
        include: { assignedTo: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ surat, currentUser: user });
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();

  const formData = await request.formData();
  const raw = {
    tajuk: formData.get("tajuk")?.toString() ?? "",
    noRujukan: formData.get("noRujukan")?.toString() || undefined,
    tarikhSurat: formData.get("tarikhSurat")?.toString() ?? "",
    sumber: formData.get("sumber")?.toString() || undefined,
    kategori: formData.get("kategori")?.toString() || undefined,
    link: formData.get("link")?.toString() || undefined,
    catatan: formData.get("catatan")?.toString() || undefined,
  };

  const parsed = createSuratSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak sah." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  let fileName: string | undefined;
  let fileStoredName: string | undefined;

  const preUploadedStoredName = formData.get("fileStoredName")?.toString();
  const preUploadedFileName = formData.get("fileName")?.toString();

  if (preUploadedStoredName && preUploadedFileName) {
    // Fail sudah dimuat naik terus ke Vercel Blob dari pelayar (elak had
    // saiz badan permintaan 4.5MB pada Vercel Functions).
    fileName = preUploadedFileName;
    fileStoredName = preUploadedStoredName;
  } else if (file instanceof File && file.size > 0) {
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Jenis fail tidak disokong. Sila muat naik PDF, imej, atau dokumen Word." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Saiz fail melebihi had 15MB." },
        { status: 400 }
      );
    }
    const saved = await saveUploadedFile(file);
    fileName = saved.originalName;
    fileStoredName = saved.storedName;
  }

  if (!fileStoredName && !parsed.data.link) {
    return NextResponse.json(
      { error: "Sila muat naik fail atau berikan pautan surat." },
      { status: 400 }
    );
  }

  const surat = await prisma.surat.create({
    data: {
      tajuk: parsed.data.tajuk,
      noRujukan: parsed.data.noRujukan,
      tarikhSurat: new Date(parsed.data.tarikhSurat),
      sumber: parsed.data.sumber,
      kategori: parsed.data.kategori,
      link: parsed.data.link || undefined,
      catatan: parsed.data.catatan,
      fileName,
      fileStoredName,
      createdById: user.userId,
    },
  });

  return NextResponse.json({ surat }, { status: 201 });
}
