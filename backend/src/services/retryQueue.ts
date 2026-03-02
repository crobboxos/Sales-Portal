import PgBoss from "pg-boss";
import { env } from "../config/env";

const JOB_NAME = "submission.retry";

export class RetryQueue {
  private boss: PgBoss | null = null;
  private handler: ((submissionId: string, attempt: number) => Promise<void>) | null = null;

  public async start(handler: (submissionId: string, attempt: number) => Promise<void>): Promise<void> {
    this.handler = handler;
    this.boss = new PgBoss({ connectionString: env.DATABASE_URL });

    await this.boss.start();
    await this.boss.createQueue(JOB_NAME);

    await this.boss.work(
      JOB_NAME,
      { batchSize: env.QUEUE_CONCURRENCY },
      async (jobs) => {
        if (!this.handler) {
          return;
        }

        for (const job of jobs) {
          const data = job.data as { submissionId: string; attempt: number };
          await this.handler(data.submissionId, data.attempt);
        }
      }
    );
  }

  public async stop(): Promise<void> {
    if (this.boss) {
      await this.boss.stop();
      this.boss = null;
    }
  }

  public async scheduleRetry(submissionId: string, attempt: number): Promise<void> {
    if (!this.boss) {
      throw new Error("Retry queue not started.");
    }

    const delaySeconds = env.RETRY_DELAYS_SECONDS_PARSED[Math.max(0, attempt - 1)];
    if (!delaySeconds) {
      throw new Error(`No delay configured for retry attempt ${attempt}.`);
    }

    await this.boss.send(JOB_NAME, { submissionId, attempt }, { startAfter: delaySeconds });
  }

  public maxAttempts(): number {
    return env.RETRY_DELAYS_SECONDS_PARSED.length;
  }
}

export const retryQueue = new RetryQueue();
