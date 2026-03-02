import { withTransaction } from "../db/pool";
import {
  upsertAccountRef,
  upsertPicklistValues,
  upsertPricebookEntryRef,
  upsertProductRef
} from "../repositories/referenceRepository";
import { salesforceClient } from "./salesforceClient";

interface SalesforceAccountRecord {
  Id: string;
  Name: string;
  Account_Number_aoc__c?: string;
  SCMC__Active__c?: boolean;
  SCMC__Customer__c?: boolean;
  SCMC__E_Mail__c?: string;
  BillingCity?: string;
  BillingPostalCode?: string;
  RecordType?: {
    Name?: string;
  };
}

interface SalesforcePricebookRecord {
  Id: string;
  Product2Id: string;
  ProductCode?: string;
  UnitPrice: number;
  CurrencyIsoCode: string;
  IsActive: boolean;
  Pricebook2Id: string;
  Pricebook2?: {
    Name?: string;
  };
  Product2?: {
    Id: string;
    Name: string;
    IsActive: boolean;
    Product_Sub_Type__c?: string;
    Line_of_Business__c?: string;
    Product_Category__c?: string;
  };
}

interface DescribeResult {
  fields: Array<{
    name: string;
    picklistValues?: Array<{
      active: boolean;
      defaultValue: boolean;
      label: string;
      value: string;
    }>;
  }>;
}

async function syncAccounts(): Promise<number> {
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

  const records = await salesforceClient.queryAll<SalesforceAccountRecord>(soql);

  await withTransaction(async (client) => {
    for (const record of records) {
      await upsertAccountRef(
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

async function syncProductsAndPricebooks(): Promise<number> {
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

  const records = await salesforceClient.queryAll<SalesforcePricebookRecord>(soql);

  await withTransaction(async (client) => {
    for (const record of records) {
      await upsertProductRef(
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

      await upsertPricebookEntryRef(
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

async function syncPicklistsForObject(objectApiName: string, fieldsToCapture: string[]): Promise<void> {
  const describe = (await salesforceClient.describe(objectApiName)) as DescribeResult;

  await withTransaction(async (client) => {
    for (const fieldName of fieldsToCapture) {
      const field = describe.fields.find((candidate) => candidate.name === fieldName);
      if (!field || !field.picklistValues) {
        continue;
      }

      await upsertPicklistValues(
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

async function syncPicklists(): Promise<void> {
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

export async function runReferenceDataSync(): Promise<{
  accountsSynced: number;
  pricebookEntriesSynced: number;
}> {
  if (!salesforceClient.isConfigured()) {
    throw new Error("Salesforce credentials are missing; cannot sync reference data.");
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