"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryQueue = exports.RetryQueue = void 0;
const pg_boss_1 = __importDefault(require("pg-boss"));
const env_1 = require("../config/env");
const JOB_NAME = "submission.retry";
class RetryQueue {
  boss = null;
  handler = null;
  async start(handler) {
    this.handler = handler;
    this.boss = new pg_boss_1.default({
      connectionString: env_1.env.DATABASE_URL
    });
    await this.boss.start();
    await this.boss.createQueue(JOB_NAME);
    await this.boss.work(
      JOB_NAME,
      { batchSize: env_1.env.QUEUE_CONCURRENCY },
      async (jobs) => {
        if (!this.handler) {
          return;
        }
        for (const job of jobs) {
          const data = job.data;
          await this.handler(data.submissionId, data.attempt);
        }
      }
    );
  }
  async stop() {
    if (this.boss) {
      await this.boss.stop();
      this.boss = null;
    }
  }
  async scheduleRetry(submissionId, attempt) {
    if (!this.boss) {
      throw new Error("Retry queue not started.");
    }
    const delaySeconds =
      env_1.env.RETRY_DELAYS_SECONDS_PARSED[Math.max(0, attempt - 1)];
    if (!delaySeconds) {
      throw new Error(`No delay configured for retry attempt ${attempt}.`);
    }
    await this.boss.send(
      JOB_NAME,
      { submissionId, attempt },
      { startAfter: delaySeconds }
    );
  }
  maxAttempts() {
    return env_1.env.RETRY_DELAYS_SECONDS_PARSED.length;
  }
}
exports.RetryQueue = RetryQueue;
exports.retryQueue = new RetryQueue();
