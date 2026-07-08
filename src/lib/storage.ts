import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { put, get, del } from "@vercel/blob";

export const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function mimeTypeFromFileName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export const ALLOWED_UPLOAD_MIME_TYPES = Object.values(MIME_BY_EXT);

export const MAX_UPLOAD_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const UPLOAD_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.UPLOAD_DIR ?? "./data/uploads"
);

export async function saveUploadedFile(
  file: File
): Promise<{ storedName: string; originalName: string }> {
  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (USE_BLOB) {
    await put(storedName, buffer, {
      access: "private",
      contentType: mimeTypeFromFileName(file.name),
      addRandomSuffix: false,
    });
    return { storedName, originalName: file.name };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  return { storedName, originalName: file.name };
}

export function resolveUploadPath(storedName: string): string {
  const resolved = path.resolve(UPLOAD_DIR, storedName);
  if (!resolved.startsWith(UPLOAD_DIR)) {
    throw new Error("Nama fail tidak sah.");
  }
  return resolved;
}

export async function readUploadedFile(storedName: string): Promise<Buffer> {
  if (USE_BLOB) {
    const result = await get(storedName, { access: "private" });
    if (!result) throw new Error("Fail tidak dijumpai.");
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  return readFile(resolveUploadPath(storedName));
}

export async function deleteUploadedFile(storedName: string): Promise<void> {
  try {
    if (USE_BLOB) {
      await del(storedName);
      return;
    }
    await unlink(resolveUploadPath(storedName));
  } catch {
    // fail silently jika fail sudah tiada
  }
}
