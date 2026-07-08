import "dotenv/config";
import { readFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { put } from "@vercel/blob";
import { mimeTypeFromFileName } from "../src/lib/storage";

interface EksportData {
  dieksportPada: string;
  users: Array<{
    id: string;
    name: string;
    username: string;
    email: string | null;
    passwordHash: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  surat: Array<{
    id: string;
    tajuk: string;
    noRujukan: string | null;
    tarikhSurat: string;
    sumber: string | null;
    kategori: string | null;
    link: string | null;
    fileName: string | null;
    fileStoredName: string | null;
    fileBase64: string | null;
    status: string;
    catatan: string | null;
    ringkasanAI: string | null;
    ringkasanDijanaPada: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: string;
  }>;
  tindakan: Array<{
    id: string;
    suratId: string;
    assignedToId: string;
    assignedById: string;
    arahan: string;
    tarikhAkhir: string | null;
    status: string;
    catatanStaff: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  }>;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Guna: tsx scripts/import-eksport.ts <path-ke-fail-eksport.json>");
    process.exit(1);
  }

  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (!useBlob) {
    console.warn(
      "Amaran: BLOB_READ_WRITE_TOKEN tidak ditetapkan - fail surat TIDAK akan diimport."
    );
  }

  const data: EksportData = JSON.parse(readFileSync(filePath, "utf-8"));

  console.log(
    `Mengimport ${data.users.length} pengguna, ${data.surat.length} surat, ${data.tindakan.length} tindakan...`
  );

  for (const u of data.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role as never,
        isActive: u.isActive,
        createdAt: new Date(u.createdAt),
      },
      update: {},
    });
  }
  console.log(`${data.users.length} pengguna diimport.`);

  for (const s of data.surat) {
    let fileStoredName = s.fileStoredName;

    if (s.fileBase64 && s.fileStoredName && useBlob) {
      const buffer = Buffer.from(s.fileBase64, "base64");
      await put(s.fileStoredName, buffer, {
        access: "private",
        contentType: mimeTypeFromFileName(s.fileStoredName),
        addRandomSuffix: false,
      });
      console.log(`Fail dimuat naik ke Blob: ${s.fileStoredName}`);
    } else if (s.fileStoredName && !useBlob) {
      fileStoredName = null;
      console.warn(
        `Fail untuk surat "${s.tajuk}" dilangkau (tiada BLOB_READ_WRITE_TOKEN).`
      );
    }

    await prisma.surat.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        tajuk: s.tajuk,
        noRujukan: s.noRujukan,
        tarikhSurat: new Date(s.tarikhSurat),
        sumber: s.sumber,
        kategori: s.kategori,
        link: s.link,
        fileName: s.fileName,
        fileStoredName,
        status: s.status as never,
        catatan: s.catatan,
        ringkasanAI: s.ringkasanAI,
        ringkasanDijanaPada: s.ringkasanDijanaPada
          ? new Date(s.ringkasanDijanaPada)
          : null,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        createdById: s.createdById,
      },
      update: {},
    });
  }
  console.log(`${data.surat.length} surat diimport.`);

  for (const t of data.tindakan) {
    await prisma.tindakan.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        suratId: t.suratId,
        assignedToId: t.assignedToId,
        assignedById: t.assignedById,
        arahan: t.arahan,
        tarikhAkhir: t.tarikhAkhir ? new Date(t.tarikhAkhir) : null,
        status: t.status as never,
        catatanStaff: t.catatanStaff,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
      },
      update: {},
    });
  }
  console.log(`${data.tindakan.length} tindakan diimport.`);

  console.log("Import selesai.");
}

main()
  .catch((err) => {
    console.error("Import gagal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
