"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubmission = createSubmission;
exports.updateSubmissionStatus = updateSubmissionStatus;
exports.getSubmissionById = getSubmissionById;
exports.listSubmissions = listSubmissions;
exports.createSyncJob = createSyncJob;
const pool_1 = require("../db/pool");
async function createSubmission(dealId, submittedBy) {
  const sql = `
    INSERT INTO submission (
      deal_id,
      status,
      submitted_by,
      submitted_at,
      retry_count,
      created_at,
      updated_at
    ) VALUES ($1, 'pending', $2, NOW(), 0, NOW(), NOW())
    RETURNING *;
  `;
  const result = await (0, pool_1.query)(sql, [dealId, submittedBy]);
  return result.rows[0];
}
async function updateSubmissionStatus(submissionId, status, updates = {}) {
  const sql = `
    UPDATE submission
    SET
      status = $2,
      sf_opportunity_id = COALESCE($3, sf_opportunity_id),
      error_detail = CASE WHEN $4::JSONB IS NULL THEN error_detail ELSE $4::JSONB END,
      retry_count = COALESCE($5, retry_count),
      last_http_status = COALESCE($6, last_http_status),
      last_attempt_at = CASE WHEN $7::BOOLEAN THEN NOW() ELSE last_attempt_at END,
      updated_at = NOW()
    WHERE id = $1;
  `;
  await (0, pool_1.query)(sql, [
    submissionId,
    status,
    updates.sfOpportunityId ?? null,
    updates.errorDetail ? JSON.stringify(updates.errorDetail) : null,
    updates.retryCount ?? null,
    updates.lastHttpStatus ?? null,
    updates.markAttempted ?? false
  ]);
}
async function getSubmissionById(submissionId) {
  const result = await (0, pool_1.query)(
    "SELECT * FROM submission WHERE id = $1",
    [submissionId]
  );
  return result.rows[0] ?? null;
}
async function listSubmissions(userEmail) {
  const sql = `
    SELECT s.*
    FROM submission s
    INNER JOIN deal d ON d.id = s.deal_id
    WHERE ($1::TEXT IS NULL OR d.created_by = $1)
    ORDER BY s.updated_at DESC;
  `;
  const result = await (0, pool_1.query)(sql, [userEmail ?? null]);
  return result.rows;
}
async function createSyncJob(input) {
  const sql = `
    INSERT INTO sync_job (
      submission_id,
      direction,
      object_type,
      sf_record_id,
      status,
      attempt_count,
      payload,
      last_error,
      created_at,
      updated_at,
      completed_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW(),CASE WHEN $5 = 'completed' THEN NOW() ELSE NULL END);
  `;
  await (0, pool_1.query)(sql, [
    input.submissionId,
    input.direction,
    input.objectType,
    input.sfRecordId ?? null,
    input.status,
    input.attemptCount ?? 0,
    input.payload ? JSON.stringify(input.payload) : null,
    input.lastError ?? null
  ]);
}
