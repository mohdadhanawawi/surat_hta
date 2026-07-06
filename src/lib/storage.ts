import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.UPLOAD_DIR ?? "./data/uploads"
);

export async function saveUploadedFile(
  file: File
): Promise<{ storedName: string; originalName: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

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

export async function deleteUploadedFile(storedName: string): Promise<void> {
  try {
    await unlink(resolveUploadPath(storedName));
  } catch {
    // fail silently jika fail sudah tiada
  }
}
