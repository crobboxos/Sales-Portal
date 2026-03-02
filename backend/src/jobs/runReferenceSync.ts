import { pool } from "../db/pool";
import { runReferenceDataSync } from "../services/referenceSyncService";

runReferenceDataSync()
  .then(async (result) => {
    console.log(`Reference sync completed: ${JSON.stringify(result)}`);
    await pool.end();
  })
  .catch(async (error: unknown) => {
    console.error("Reference sync failed", error);
    await pool.end();
    process.exit(1);
  });