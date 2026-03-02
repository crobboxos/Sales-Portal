"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRetryWorker = startRetryWorker;
const dealSubmissionService_1 = require("../services/dealSubmissionService");
const retryQueue_1 = require("../services/retryQueue");
async function startRetryWorker() {
  await retryQueue_1.retryQueue.start(async (submissionId, attempt) => {
    await (0, dealSubmissionService_1.retrySubmission)(submissionId, attempt);
  });
}
