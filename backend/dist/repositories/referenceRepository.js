"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertAccountRef = upsertAccountRef;
exports.upsertProductRef = upsertProductRef;
exports.upsertPricebookEntryRef = upsertPricebookEntryRef;
exports.upsertPicklistValues = upsertPicklistValues;
exports.findAccounts = findAccounts;
exports.findProducts = findProducts;
exports.getPicklistValues = getPicklistValues;
exports.getDeliveryPricebookEntry = getDeliveryPricebookEntry;
const pool_1 = require("../db/pool");
async function upsertAccountRef(input, client) {
  const runner = client ?? pool_1.query;
  const sql = `
    INSERT INTO account_ref (
      sf_account_id,
      name,
      account_number,
      billing_city,
      billing_postal_code,
      record_type_name,
      scmc_active,
      scmc_customer,
      scmc_email,
      raw_payload,
      synced_at,
      updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
    ON CONFLICT (sf_account_id) DO UPDATE SET
      name = EXCLUDED.name,
      account_number = EXCLUDED.account_number,
      billing_city = EXCLUDED.billing_city,
      billing_postal_code = EXCLUDED.billing_postal_code,
      record_type_name = EXCLUDED.record_type_name,
      scmc_active = EXCLUDED.scmc_active,
      scmc_customer = EXCLUDED.scmc_customer,
      scmc_email = EXCLUDED.scmc_email,
      raw_payload = EXCLUDED.raw_payload,
      synced_at = NOW(),
      updated_at = NOW();
  `;
  const params = [
    input.sfAccountId,
    input.name,
    input.accountNumber ?? null,
    input.billingCity ?? null,
    input.billingPostalCode ?? null,
    input.recordTypeName ?? null,
    input.scmcActive ?? null,
    input.scmcCustomer ?? null,
    input.scmcEmail ?? null,
    JSON.stringify(input.rawPayload)
  ];
  if ("query" in runner) {
    await runner.query(sql, params);
    return;
  }
  await runner(sql, params);
}
async function upsertProductRef(input, client) {
  const runner = client ?? pool_1.query;
  const sql = `
    INSERT INTO product_ref (
      sf_product2_id,
      name,
      is_active,
      product_sub_type,
      line_of_business,
      product_category,
      raw_payload,
      synced_at,
      updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
    ON CONFLICT (sf_product2_id) DO UPDATE SET
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active,
      product_sub_type = EXCLUDED.product_sub_type,
      line_of_business = EXCLUDED.line_of_business,
      product_category = EXCLUDED.product_category,
      raw_payload = EXCLUDED.raw_payload,
      synced_at = NOW(),
      updated_at = NOW();
  `;
  const params = [
    input.sfProduct2Id,
    input.name,
    input.isActive,
    input.productSubType ?? null,
    input.lineOfBusiness ?? null,
    input.productCategory ?? null,
    JSON.stringify(input.rawPayload)
  ];
  if ("query" in runner) {
    await runner.query(sql, params);
    return;
  }
  await runner(sql, params);
}
async function upsertPricebookEntryRef(input, client) {
  const runner = client ?? pool_1.query;
  const sql = `
    INSERT INTO pricebook_entry_ref (
      sf_pricebook_entry_id,
      sf_pricebook2_id,
      pricebook_name,
      sf_product2_id,
      product_code,
      unit_price,
      currency_iso_code,
      is_active,
      raw_payload,
      synced_at,
      updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
    ON CONFLICT (sf_pricebook_entry_id) DO UPDATE SET
      sf_pricebook2_id = EXCLUDED.sf_pricebook2_id,
      pricebook_name = EXCLUDED.pricebook_name,
      sf_product2_id = EXCLUDED.sf_product2_id,
      product_code = EXCLUDED.product_code,
      unit_price = EXCLUDED.unit_price,
      currency_iso_code = EXCLUDED.currency_iso_code,
      is_active = EXCLUDED.is_active,
      raw_payload = EXCLUDED.raw_payload,
      synced_at = NOW(),
      updated_at = NOW();
  `;
  const params = [
    input.sfPricebookEntryId,
    input.sfPricebook2Id,
    input.pricebookName ?? null,
    input.sfProduct2Id,
    input.productCode ?? null,
    input.unitPrice,
    input.currencyIsoCode,
    input.isActive,
    JSON.stringify(input.rawPayload)
  ];
  if ("query" in runner) {
    await runner.query(sql, params);
    return;
  }
  await runner(sql, params);
}
async function upsertPicklistValues(
  objectApiName,
  fieldApiName,
  values,
  client
) {
  const runner = client ?? pool_1.query;
  const deleteSql = `DELETE FROM picklist_values WHERE object_api_name = $1 AND field_api_name = $2;`;
  if ("query" in runner) {
    await runner.query(deleteSql, [objectApiName, fieldApiName]);
  } else {
    await runner(deleteSql, [objectApiName, fieldApiName]);
  }
  for (const value of values) {
    const insertSql = `
      INSERT INTO picklist_values (
        object_api_name,
        field_api_name,
        value,
        label,
        is_active,
        is_default,
        synced_at
      ) VALUES ($1,$2,$3,$4,$5,$6,NOW())
      ON CONFLICT (object_api_name, field_api_name, value) DO UPDATE SET
        label = EXCLUDED.label,
        is_active = EXCLUDED.is_active,
        is_default = EXCLUDED.is_default,
        synced_at = NOW();
    `;
    const params = [
      value.objectApiName,
      value.fieldApiName,
      value.value,
      value.label,
      value.isActive,
      value.isDefault
    ];
    if ("query" in runner) {
      await runner.query(insertSql, params);
    } else {
      await runner(insertSql, params);
    }
  }
}
async function findAccounts(search, limit = 25) {
  const sql = `
    SELECT
      sf_account_id AS "sfAccountId",
      name,
      account_number AS "accountNumber",
      billing_city AS "billingCity",
      billing_postal_code AS "billingPostalCode",
      record_type_name AS "recordTypeName",
      scmc_active AS "scmcActive",
      scmc_customer AS "scmcCustomer",
      scmc_email AS "scmcEmail"
    FROM account_ref
    WHERE ($1::TEXT IS NULL OR name ILIKE '%' || $1 || '%' OR account_number ILIKE '%' || $1 || '%')
    ORDER BY name ASC
    LIMIT $2;
  `;
  const result = await (0, pool_1.query)(sql, [search ?? null, limit]);
  return result.rows;
}
async function findProducts(lob, currency, limit = 100) {
  const sql = `
    SELECT
      p.sf_product2_id AS "sfProduct2Id",
      p.name,
      p.line_of_business AS "lineOfBusiness",
      p.product_sub_type AS "productSubType",
      p.product_category AS "productCategory",
      p.is_active AS "isActive",
      pe.sf_pricebook_entry_id AS "sfPricebookEntryId",
      pe.sf_pricebook2_id AS "sfPricebook2Id",
      pe.pricebook_name AS "pricebookName",
      pe.currency_iso_code AS "currencyIsoCode",
      pe.unit_price AS "unitPrice",
      pe.product_code AS "productCode"
    FROM product_ref p
    INNER JOIN pricebook_entry_ref pe ON pe.sf_product2_id = p.sf_product2_id
    WHERE p.is_active = TRUE
      AND pe.is_active = TRUE
      AND ($1::TEXT IS NULL OR p.line_of_business = $1)
      AND ($2::TEXT IS NULL OR pe.currency_iso_code = $2)
    ORDER BY p.name ASC
    LIMIT $3;
  `;
  const result = await (0, pool_1.query)(sql, [
    lob ?? null,
    currency ?? null,
    limit
  ]);
  return result.rows;
}
async function getPicklistValues(objectApiName, fieldApiName) {
  const sql = `
    SELECT
      value,
      label,
      is_active AS "isActive",
      is_default AS "isDefault",
      synced_at AS "syncedAt"
    FROM picklist_values
    WHERE object_api_name = $1
      AND field_api_name = $2
      AND is_active = TRUE
    ORDER BY value ASC;
  `;
  const result = await (0, pool_1.query)(sql, [objectApiName, fieldApiName]);
  return result.rows;
}
async function getDeliveryPricebookEntry(
  productCode,
  currencyIsoCode,
  pricebook2Id
) {
  const sql = `
    SELECT
      sf_pricebook_entry_id AS "sfPricebookEntryId",
      sf_product2_id AS "sfProduct2Id",
      unit_price::FLOAT8 AS "unitPrice"
    FROM pricebook_entry_ref
    WHERE product_code = $1
      AND currency_iso_code = $2
      AND sf_pricebook2_id = $3
      AND is_active = TRUE
    ORDER BY updated_at DESC
    LIMIT 1;
  `;
  const result = await (0, pool_1.query)(sql, [
    productCode,
    currencyIsoCode,
    pricebook2Id
  ]);
  return result.rows[0] ?? null;
}
