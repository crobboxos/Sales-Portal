"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = require("../db/pool");
const referenceSyncService_1 = require("../services/referenceSyncService");
(0, referenceSyncService_1.runReferenceDataSync)()
  .then(async (result) => {
    console.log(`Reference sync completed: ${JSON.stringify(result)}`);
    await pool_1.pool.end();
  })
  .catch(async (error) => {
    console.error("Reference sync failed", error);
    await pool_1.pool.end();
    process.exit(1);
  });
