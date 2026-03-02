import { query } from "../db/pool";

export async function createAuditEvent(input: {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  payloadDiff?: unknown;
  metadata?: unknown;
}): Promise<void> {
  const sql = `
    INSERT INTO audit_event (
      entity_type,
      entity_id,
      action,
      user_id,
      payload_diff,
      metadata,
      created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,NOW());
  `;

  await query(sql, [
    input.entityType,
    input.entityId,
    input.action,
    input.userId,
    input.payloadDiff ? JSON.stringify(input.payloadDiff) : null,
    input.metadata ? JSON.stringify(input.metadata) : null
  ]);
}