"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const retryWorker_1 = require("./jobs/retryWorker");
const pool_1 = require("./db/pool");
async function bootstrap() {
  const app = (0, app_1.createApp)();
  await (0, retryWorker_1.startRetryWorker)();
  const server = app.listen(env_1.env.PORT, () => {
    console.log(`Backend listening on port ${env_1.env.PORT}`);
  });
  const shutdown = async () => {
    server.close(async () => {
      await pool_1.pool.end();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}
bootstrap().catch((error) => {
  console.error("Fatal startup error", error);
  process.exit(1);
});
