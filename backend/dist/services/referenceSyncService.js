"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReferenceDataSync = runReferenceDataSync;
const pool_1 = require("../db/pool");
const referenceRepository_1 = require("../repositories/referenceRepository");
const salesforceClient_1 = require("./salesforceClient");
async function syncAccounts() {
  const soql = `
    SELECT
      Id,
      Name,
      Account_Number_aoc__c,
      SCMC__Active__c,
      SCMC__Customer__c,
      SCMC__E_Mail__c,
      BillingCity,
      BillingPostalCode,
      RecordType.Name
    FROM Account
    WHERE RecordType.Name != 'Supplier'
      AND SCMC__Active__c = TRUE
    ORDER BY Name
    LIMIT 2000
  `;
  const records = await salesforceClient_1.salesforceClient.queryAll(soql);
  await (0, pool_1.withTransaction)(async (client) => {
    for (const record of records) {
      await (0, referenceRepository_1.upsertAccountRef)(
        {
          sfAccountId: record.Id,
          name: record.Name,
          accountNumber: record.Account_Number_aoc__c,
          billingCity: record.BillingCity,
          billingPostalCode: record.BillingPostalCode,
          recordTypeName: record.RecordType?.Name,
          scmcActive: record.SCMC__Active__c,
          scmcCustomer: record.SCMC__Customer__c,
          scmcEmail: record.SCMC__E_Mail__c,
          rawPayload: record
        },
        client
      );
    }
  });
  return records.length;
}
async function syncProductsAndPricebooks() {
  const soql = `
    SELECT
      Id,
      Product2Id,
      ProductCode,
      UnitPrice,
      CurrencyIsoCode,
      IsActive,
      Pricebook2Id,
      Pricebook2.Name,
      Product2.Id,
      Product2.Name,
      Product2.IsActive,
      Product2.Product_Sub_Type__c,
      Product2.Line_of_Business__c,
      Product2.Product_Category__c
    FROM PricebookEntry
    WHERE Product2.IsActive = TRUE
      AND Pricebook2.IsActive = TRUE
      AND IsActive = TRUE
  `;
  const records = await salesforceClient_1.salesforceClient.queryAll(soql);
  await (0, pool_1.withTransaction)(async (client) => {
    for (const record of records) {
      await (0, referenceRepository_1.upsertProductRef)(
        {
          sfProduct2Id: record.Product2Id,
          name: record.Product2?.Name ?? "Unknown",
          isActive: Boolean(record.Product2?.IsActive),
          productSubType: record.Product2?.Product_Sub_Type__c,
          lineOfBusiness: record.Product2?.Line_of_Business__c,
          productCategory: record.Product2?.Product_Category__c,
          rawPayload: record.Product2 ?? record
        },
        client
      );
      await (0, referenceRepository_1.upsertPricebookEntryRef)(
        {
          sfPricebookEntryId: record.Id,
          sfPricebook2Id: record.Pricebook2Id,
          pricebookName: record.Pricebook2?.Name,
          sfProduct2Id: record.Product2Id,
          productCode: record.ProductCode,
          unitPrice: Number(record.UnitPrice),
          currencyIsoCode: record.CurrencyIsoCode,
          isActive: Boolean(record.IsActive),
          rawPayload: record
        },
        client
      );
    }
  });
  return records.length;
}
async function syncPicklistsForObject(objectApiName, fieldsToCapture) {
  const describe =
    await salesforceClient_1.salesforceClient.describe(objectApiName);
  await (0, pool_1.withTransaction)(async (client) => {
    for (const fieldName of fieldsToCapture) {
      const field = describe.fields.find(
        (candidate) => candidate.name === fieldName
      );
      if (!field || !field.picklistValues) {
        continue;
      }
      await (0, referenceRepository_1.upsertPicklistValues)(
        objectApiName,
        fieldName,
        field.picklistValues.map((value) => ({
          objectApiName,
          fieldApiName: fieldName,
          value: value.value,
          label: value.label,
          isActive: value.active,
          isDefault: value.defaultValue
        })),
        client
      );
    }
  });
}
async function syncPicklists() {
  await syncPicklistsForObject("Opportunity", [
    "StageName",
    "Lines_Of_Business__c",
    "Funding_Type__c",
    "IWM_Sales_Order_Type__c",
    "CurrencyIsoCode"
  ]);
  await syncPicklistsForObject("OpportunityLineItem", [
    "Product_Condition__c",
    "Contract_Type_Software__c",
    "Subscription_Billing_Commitment__c",
    "Subscription_Billing_Plan__c"
  ]);
}
async function runReferenceDataSync() {
  if (!salesforceClient_1.salesforceClient.isConfigured()) {
    throw new Error(
      "Salesforce credentials are missing; cannot sync reference data."
    );
  }
  const [accountsSynced, pricebookEntriesSynced] = await Promise.all([
    syncAccounts(),
    syncProductsAndPricebooks()
  ]);
  await syncPicklists();
  return {
    accountsSynced,
    pricebookEntriesSynced
  };
}
