import { query } from "../db/pool";

export interface SubmissionRecord {
  id: string;
  deal_id: string;
  status: string;
  sf_opportunity_id: string | null;
  submitted_by: string;
  submitted_at: string;
  error_detail: unknown;
  retry_count: number;
  last_attempt_at: string | null;
  last_http_status: number | null;
  created_at: string;
  updated_at: string;
}

export async function createSubmission(dealId: string, submittedBy: string): Promise<SubmissionRecord> {
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

  const result = await query<SubmissionRecord>(sql, [dealId, submittedBy]);
  return result.rows[0];
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: string,
  updates: {
    sfOpportunityId?: string;
    errorDetail?: unknown;
    retryCount?: number;
    lastHttpStatus?: number;
    markAttempted?: boolean;
  } = {}
): Promise<void> {
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

  await query(sql, [
    submissionId,
    status,
    updates.sfOpportunityId ?? null,
    updates.errorDetail ? JSON.stringify(updates.errorDetail) : null,
    updates.retryCount ?? null,
    updates.lastHttpStatus ?? null,
    updates.markAttempted ?? false
  ]);
}

export async function getSubmissionById(submissionId: string): Promise<SubmissionRecord | null> {
  const result = await query<SubmissionRecord>("SELECT * FROM submission WHERE id = $1", [submissionId]);
  return result.rows[0] ?? null;
}

export async function listSubmissions(userEmail?: string): Promise<SubmissionRecord[]> {
  const sql = `
    SELECT s.*
    FROM submission s
    INNER JOIN deal d ON d.id = s.deal_id
    WHERE ($1::TEXT IS NULL OR d.created_by = $1)
    ORDER BY s.updated_at DESC;
  `;

  const result = await query<SubmissionRecord>(sql, [userEmail ?? null]);
  return result.rows;
}

export async function createSyncJob(input: {
  submissionId: string;
  direction: string;
  objectType: string;
  sfRecordId?: string;
  status: string;
  attemptCount?: number;
  payload?: unknown;
  lastError?: string;
}): Promise<void> {
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

  await query(sql, [
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