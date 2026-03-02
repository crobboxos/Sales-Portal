"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool_1 = require("./pool");
function resolveMigrationDirectory() {
  const direct = path_1.default.resolve(process.cwd(), "migrations");
  if (fs_1.default.existsSync(direct)) {
    return direct;
  }
  const nested = path_1.default.resolve(process.cwd(), "backend", "migrations");
  if (fs_1.default.existsSync(nested)) {
    return nested;
  }
  throw new Error("Could not locate migrations directory.");
}
async function ensureMigrationTable() {
  await pool_1.pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
async function runMigrations() {
  const migrationDir = resolveMigrationDirectory();
  const files = fs_1.default
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }
  await ensureMigrationTable();
  for (const file of files) {
    const existing = await pool_1.pool.query(
      "SELECT filename FROM schema_migrations WHERE filename = $1",
      [file]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      continue;
    }
    const sql = fs_1.default.readFileSync(
      path_1.default.join(migrationDir, file),
      "utf8"
    );
    const client = await pool_1.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file]
      );
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
    await pool_1.pool.end();
    console.log("Migration run complete.");
  })
  .catch(async (error) => {
    console.error("Migration failure", error);
    await pool_1.pool.end();
    process.exit(1);
  });
