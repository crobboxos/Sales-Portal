"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditEvent = createAuditEvent;
const pool_1 = require("../db/pool");
async function createAuditEvent(input) {
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
  await (0, pool_1.query)(sql, [
    input.entityType,
    input.entityId,
    input.action,
    input.userId,
    input.payloadDiff ? JSON.stringify(input.payloadDiff) : null,
    input.metadata ? JSON.stringify(input.metadata) : null
  ]);
}
