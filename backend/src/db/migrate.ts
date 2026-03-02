import fs from "fs";
import path from "path";
import { pool } from "./pool";

function resolveMigrationDirectory(): string {
  const direct = path.resolve(process.cwd(), "migrations");
  if (fs.existsSync(direct)) {
    return direct;
  }

  const nested = path.resolve(process.cwd(), "backend", "migrations");
  if (fs.existsSync(nested)) {
    return nested;
  }

  throw new Error("Could not locate migrations directory.");
}

async function ensureMigrationTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function runMigrations(): Promise<void> {
  const migrationDir = resolveMigrationDirectory();
  const files = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  await ensureMigrationTable();

  for (const file of files) {
    const existing = await pool.query<{ filename: string }>(
      "SELECT filename FROM schema_migrations WHERE filename = $1",
      [file]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

runMigrations()
  .then(async () => {
    await pool.end();
    console.log("Migration run complete.");
  })
  .catch(async (error: unknown) => {
    console.error("Migration failure", error);
    await pool.end();
    process.exit(1);
  });