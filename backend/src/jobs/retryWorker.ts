import { retrySubmission } from "../services/dealSubmissionService";
import { retryQueue } from "../services/retryQueue";

export async function startRetryWorker(): Promise<void> {
  await retryQueue.start(async (submissionId, attempt) => {
    await retrySubmission(submissionId, attempt);
  });
}