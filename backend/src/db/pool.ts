import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";

const shouldUseSsl = env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30_000
});

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
