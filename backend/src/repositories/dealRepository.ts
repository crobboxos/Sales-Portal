import { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { DealInput, DealLineInput, DealLineRecord, DealRecord } from "../models/deal";
import { query, withTransaction } from "../db/pool";

async function insertDealLine(
  client: PoolClient,
  dealId: string,
  line: DealLineInput,
  sortOrder: number
): Promise<void> {
  const sql = `
    INSERT INTO deal_line_item (
      deal_id,
      portal_line_id,
      product2_id,
      pricebook_entry_id,
      quantity,
      unit_price,
      discount,
      service_date,
      sort_order,
      product_condition,
      sales_cost,
      contract_type_software,
      subscription_start_date,
      subscription_term_months,
      subscription_billing_commitment,
      subscription_billing_plan,
      is_delivery_line,
      updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW()
    );
  `;

  await client.query(sql, [
    dealId,
    line.portalLineId ?? uuidv4(),
    line.product2Id,
    line.pricebookEntryId,
    line.quantity,
    line.unitPrice,
    line.discount ?? null,
    line.serviceDate ?? null,
    line.sortOrder ?? sortOrder,
    line.productCondition,
    line.salesCost ?? 0,
    line.contractTypeSoftware ?? null,
    line.subscriptionStartDate ?? null,
    line.subscriptionTermMonths ?? null,
    line.subscriptionBillingCommitment ?? null,
    line.subscriptionBillingPlan ?? null,
    line.isDeliveryLine ?? false
  ]);
}

function calculateEstimatedValues(lines: DealLineInput[]): { estimatedRevenue: number; estimatedCosts: number } {
  let estimatedRevenue = 0;
  let estimatedCosts = 0;

  for (const line of lines) {
    const quantity = line.quantity;
    const revenue = line.unitPrice * quantity;
    const cost = (line.salesCost ?? 0) * quantity;
    estimatedRevenue += revenue;
    estimatedCosts += cost;
  }

  return { estimatedRevenue, estimatedCosts };
}

export async function createDealDraft(input: DealInput, userEmail: string): Promise<{
  deal: DealRecord;
  lines: DealLineRecord[];
}> {
  return withTransaction(async (client) => {
    const dealId = uuidv4();
    const portalDealId = input.portalDealId ?? uuidv4();
    const { estimatedCosts, estimatedRevenue } = calculateEstimatedValues(input.lines);

    const insertDealSql = `
      INSERT INTO deal (
        id,
        portal_deal_id,
        status,
        account_id,
        stage_name,
        close_date,
        lines_of_business,
        funding_type,
        currency_iso_code,
        record_type_id,
        pricebook2_id,
        company_erp_id,
        estimated_costs,
        estimated_revenue,
        notifiy,
        iwm_sales_order_req,
        iwm_sales_order_type,
        deliver_to_id,
        customer_purchase_order,
        owner_id,
        created_by,
        updated_by,
        updated_at
      ) VALUES (
        $1,$2,'draft',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW()
      );
    `;

    await client.query(insertDealSql, [
      dealId,
      portalDealId,
      input.accountId,
      input.stageName,
      input.closeDate,
      input.linesOfBusiness,
      input.fundingType,
      input.currencyIsoCode,
      input.recordTypeId,
      input.pricebook2Id,
      input.companyErpId,
      estimatedCosts,
      estimatedRevenue,
      input.notifiy,
      input.iwmSalesOrderReq,
      input.iwmSalesOrderType,
      input.deliverToId ?? null,
      input.customerPurchaseOrder ?? null,
      input.ownerId ?? null,
      userEmail,
      userEmail
    ]);

    for (let index = 0; index < input.lines.length; index += 1) {
      await insertDealLine(client, dealId, input.lines[index], index + 1);
    }

    const deal = await client.query<DealRecord>("SELECT * FROM deal WHERE id = $1", [dealId]);
    const lines = await client.query<DealLineRecord>(
      "SELECT * FROM deal_line_item WHERE deal_id = $1 ORDER BY sort_order ASC, created_at ASC",
      [dealId]
    );

    return {
      deal: deal.rows[0],
      lines: lines.rows
    };
  });
}

export async function updateDealDraft(
  dealId: string,
  input: DealInput,
  userEmail: string
): Promise<{ deal: DealRecord; lines: DealLineRecord[] }> {
  return withTransaction(async (client) => {
    const existing = await client.query<DealRecord>("SELECT * FROM deal WHERE id = $1", [dealId]);
    if (!existing.rows[0]) {
      throw new Error("Deal not found.");
    }

    const { estimatedCosts, estimatedRevenue } = calculateEstimatedValues(input.lines);

    const updateSql = `
      UPDATE deal
      SET
        account_id = $2,
        stage_name = $3,
        close_date = $4,
        lines_of_business = $5,
        funding_type = $6,
        currency_iso_code = $7,
        record_type_id = $8,
        pricebook2_id = $9,
        company_erp_id = $10,
        estimated_costs = $11,
        estimated_revenue = $12,
        notifiy = $13,
        iwm_sales_order_req = $14,
        iwm_sales_order_type = $15,
        deliver_to_id = $16,
        customer_purchase_order = $17,
        owner_id = $18,
        updated_by = $19,
        updated_at = NOW()
      WHERE id = $1;
    `;

    await client.query(updateSql, [
      dealId,
      input.accountId,
      input.stageName,
      input.closeDate,
      input.linesOfBusiness,
      input.fundingType,
      input.currencyIsoCode,
      input.recordTypeId,
      input.pricebook2Id,
      input.companyErpId,
      estimatedCosts,
      estimatedRevenue,
      input.notifiy,
      input.iwmSalesOrderReq,
      input.iwmSalesOrderType,
      input.deliverToId ?? null,
      input.customerPurchaseOrder ?? null,
      input.ownerId ?? null,
      userEmail
    ]);

    await client.query("DELETE FROM deal_line_item WHERE deal_id = $1", [dealId]);

    for (let index = 0; index < input.lines.length; index += 1) {
      await insertDealLine(client, dealId, input.lines[index], index + 1);
    }

    const deal = await client.query<DealRecord>("SELECT * FROM deal WHERE id = $1", [dealId]);
    const lines = await client.query<DealLineRecord>(
      "SELECT * FROM deal_line_item WHERE deal_id = $1 ORDER BY sort_order ASC, created_at ASC",
      [dealId]
    );

    return {
      deal: deal.rows[0],
      lines: lines.rows
    };
  });
}

export async function getDealById(dealId: string): Promise<{ deal: DealRecord; lines: DealLineRecord[] } | null> {
  const dealResult = await query<DealRecord>("SELECT * FROM deal WHERE id = $1", [dealId]);
  const deal = dealResult.rows[0];

  if (!deal) {
    return null;
  }

  const lineResult = await query<DealLineRecord>(
    "SELECT * FROM deal_line_item WHERE deal_id = $1 ORDER BY sort_order ASC, created_at ASC",
    [dealId]
  );

  return {
    deal,
    lines: lineResult.rows
  };
}

export async function listDeals(userEmail: string, status?: string): Promise<DealRecord[]> {
  const sql = `
    SELECT *
    FROM deal
    WHERE created_by = $1
      AND ($2::TEXT IS NULL OR status = $2)
    ORDER BY updated_at DESC;
  `;

  const result = await query<DealRecord>(sql, [userEmail, status ?? null]);
  return result.rows;
}

export async function insertLineItem(
  dealId: string,
  line: DealLineInput
): Promise<DealLineRecord> {
  return withTransaction(async (client) => {
    const sortResult = await client.query<{ max: number | null }>(
      "SELECT MAX(sort_order) AS max FROM deal_line_item WHERE deal_id = $1",
      [dealId]
    );
    const nextSort = (sortResult.rows[0]?.max ?? 0) + 1;

    await insertDealLine(client, dealId, line, nextSort);

    const lineResult = await client.query<DealLineRecord>(
      "SELECT * FROM deal_line_item WHERE deal_id = $1 ORDER BY created_at DESC LIMIT 1",
      [dealId]
    );

    return lineResult.rows[0];
  });
}

export async function updateLineItem(
  dealId: string,
  lineId: string,
  line: DealLineInput
): Promise<DealLineRecord | null> {
  const sql = `
    UPDATE deal_line_item
    SET
      product2_id = $3,
      pricebook_entry_id = $4,
      quantity = $5,
      unit_price = $6,
      discount = $7,
      service_date = $8,
      sort_order = $9,
      product_condition = $10,
      sales_cost = $11,
      contract_type_software = $12,
      subscription_start_date = $13,
      subscription_term_months = $14,
      subscription_billing_commitment = $15,
      subscription_billing_plan = $16,
      is_delivery_line = $17,
      updated_at = NOW()
    WHERE deal_id = $1
      AND id = $2
    RETURNING *;
  `;

  const result = await query<DealLineRecord>(sql, [
    dealId,
    lineId,
    line.product2Id,
    line.pricebookEntryId,
    line.quantity,
    line.unitPrice,
    line.discount ?? null,
    line.serviceDate ?? null,
    line.sortOrder ?? null,
    line.productCondition,
    line.salesCost ?? 0,
    line.contractTypeSoftware ?? null,
    line.subscriptionStartDate ?? null,
    line.subscriptionTermMonths ?? null,
    line.subscriptionBillingCommitment ?? null,
    line.subscriptionBillingPlan ?? null,
    line.isDeliveryLine ?? false
  ]);

  return result.rows[0] ?? null;
}

export async function deleteLineItem(dealId: string, lineId: string): Promise<boolean> {
  const result = await query("DELETE FROM deal_line_item WHERE deal_id = $1 AND id = $2", [dealId, lineId]);
  return (result.rowCount ?? 0) > 0;
}

export async function updateDealStatus(
  dealId: string,
  status: string,
  updates: {
    sfOpportunityId?: string;
    sfOpportunityName?: string;
    linkOpp2SoState?: string;
    linkOpp2SoId?: string;
    markSubmitted?: boolean;
  } = {}
): Promise<void> {
  const sql = `
    UPDATE deal
    SET
      status = $2,
      sf_opportunity_id = COALESCE($3, sf_opportunity_id),
      sf_opportunity_name = COALESCE($4, sf_opportunity_name),
      link_opp2so_state = COALESCE($5, link_opp2so_state),
      link_opp2so_id = COALESCE($6, link_opp2so_id),
      submitted_at = CASE WHEN $7::BOOLEAN THEN NOW() ELSE submitted_at END,
      updated_at = NOW()
    WHERE id = $1;
  `;

  await query(sql, [
    dealId,
    status,
    updates.sfOpportunityId ?? null,
    updates.sfOpportunityName ?? null,
    updates.linkOpp2SoState ?? null,
    updates.linkOpp2SoId ?? null,
    updates.markSubmitted ?? false
  ]);
}

export async function attachSalesforceLineIds(lineIdMap: Map<string, string>): Promise<void> {
  for (const [portalLineId, sfLineId] of lineIdMap.entries()) {
    await query(
      "UPDATE deal_line_item SET sf_oli_id = $2, updated_at = NOW() WHERE portal_line_id = $1::UUID",
      [portalLineId, sfLineId]
    );
  }
}