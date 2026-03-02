import { createApp } from "./app";
import { env } from "./config/env";
import { startRetryWorker } from "./jobs/retryWorker";
import { pool } from "./db/pool";

async function bootstrap(): Promise<void> {
  const app = createApp();

  await startRetryWorker();

  const server = app.listen(env.PORT, () => {
    console.log(`Backend listening on port ${env.PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close(async () => {
      await pool.end();
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