import "dotenv/config";
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "fs";
import path from "path";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "prisma/migrations");

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timeout (${ms}ms) semasa: ${label}`)),
      ms
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    if (process.env.VERCEL) {
      throw new Error(
        "TURSO_DATABASE_URL tidak ditetapkan semasa build di Vercel! " +
          "Ini akan menyebabkan aplikasi cuba guna fail SQLite tempatan yang " +
          "tidak wujud, dan langkah seed akan gagal dengan ralat 'table does " +
          "not exist'. Sila semak Project Settings > Environment Variables " +
          "di Vercel dan pastikan TURSO_DATABASE_URL (dan TURSO_AUTH_TOKEN) " +
          "ditanda untuk KETIGA-TIGA environment: Production, Preview, dan " +
          "Development - bukan Production sahaja. Selepas tambah/kemaskini " +
          "env var, anda perlu redeploy (env var baru tidak terpakai pada " +
          "deployment sedia ada)."
      );
    }
    console.log("TURSO_DATABASE_URL tidak ditetapkan, migrate-turso dilangkau.");
    return;
  }

  console.log(`Menyambung ke Turso: ${url.replace(/\/\/.*@/, "//<redacted>@")}`);
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Mencipta jadual _migrations_log (jika belum wujud)...");
  await withTimeout(
    client.execute(
      `CREATE TABLE IF NOT EXISTS _migrations_log (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ),
    15000,
    "cipta jadual _migrations_log"
  );
  console.log("Jadual _migrations_log sedia.");

  const applied = await withTimeout(
    client.execute("SELECT name FROM _migrations_log"),
    15000,
    "baca _migrations_log"
  );
  const appliedNames = new Set(applied.rows.map((r) => r.name as string));
  console.log(`${appliedNames.size} migration sudah diaplikasikan sebelum ini.`);

  const folders = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  console.log(`${folders.length} migration ditemui dalam prisma/migrations.`);

  for (const folder of folders) {
    if (appliedNames.has(folder)) {
      console.log(`Migration ${folder} sudah diaplikasikan, dilangkau.`);
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, folder, "migration.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    const sqlWithoutComments = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");

    const statements = sqlWithoutComments
      .split(/;\s*(?:\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Mengaplikasikan migration ${folder} (${statements.length} statement)...`);
    for (const [i, statement] of statements.entries()) {
      await withTimeout(
        client.execute(statement),
        15000,
        `migration ${folder} statement ${i + 1}/${statements.length}`
      );
    }

    await withTimeout(
      client.execute({
        sql: "INSERT INTO _migrations_log (name) VALUES (?)",
        args: [folder],
      }),
      15000,
      `catat migration ${folder} selesai`
    );
    console.log(`Migration ${folder} berjaya diaplikasikan.`);
  }

  console.log("Semua migration Turso selesai.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Gagal menjalankan migration Turso:", err);
    process.exit(1);
  });
