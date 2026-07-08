import "dotenv/config";
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "fs";
import path from "path";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "prisma/migrations");

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.log("TURSO_DATABASE_URL tidak ditetapkan, migrate-turso dilangkau.");
    return;
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  await client.execute(
    `CREATE TABLE IF NOT EXISTS _migrations_log (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  );

  const applied = await client.execute("SELECT name FROM _migrations_log");
  const appliedNames = new Set(applied.rows.map((r) => r.name as string));

  const folders = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const folder of folders) {
    if (appliedNames.has(folder)) {
      console.log(`Migration ${folder} sudah diaplikasikan, dilangkau.`);
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, folder, "migration.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    const statements = sql
      .split(/;\s*(?:\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Mengaplikasikan migration ${folder} (${statements.length} statement)...`);
    for (const statement of statements) {
      await client.execute(statement);
    }

    await client.execute({
      sql: "INSERT INTO _migrations_log (name) VALUES (?)",
      args: [folder],
    });
    console.log(`Migration ${folder} berjaya diaplikasikan.`);
  }

  console.log("Semua migration Turso selesai.");
}

main().catch((err) => {
  console.error("Gagal menjalankan migration Turso:", err);
  process.exit(1);
});
