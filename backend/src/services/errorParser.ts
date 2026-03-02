import { SalesforceMappedError } from "../models/deal";

const fieldMap: Record<string, string> = {
  AccountId: "accountId",
  StageName: "stageName",
  CloseDate: "closeDate",
  Lines_Of_Business__c: "linesOfBusiness",
  Funding_Type__c: "fundingType",
  CurrencyIsoCode: "currencyIsoCode",
  Company_ERP__c: "companyErpId",
  Notifiy__c: "notifiy",
  IWM_Sales_Order_Req__c: "iwmSalesOrderReq",
  IWM_Sales_Order_Type__c: "iwmSalesOrderType",
  Deliver_To__c: "deliverToId",
  Customer_Purchase_Order__c: "customerPurchaseOrder",
  Quantity: "quantity",
  UnitPrice: "unitPrice",
  Discount: "discount",
  PricebookEntryId: "pricebookEntryId",
  Product_Condition__c: "productCondition",
  Sales_Cost__c: "salesCost",
  Contract_Type_Software__c: "contractTypeSoftware",
  Subscription_Start_Date__c: "subscriptionStartDate",
  Subscription_Term_Months__c: "subscriptionTermMonths",
  Subscription_Billing_Commitment__c: "subscriptionBillingCommitment",
  Subscription_Billing_Plan__c: "subscriptionBillingPlan"
};

interface CompositeErrorBody {
  errorCode?: string;
  message?: string;
  fields?: string[];
}

interface CompositeSubResponse {
  referenceId: string;
  httpStatusCode: number;
  body: CompositeErrorBody[] | { id?: string; success?: boolean } | unknown;
}

interface CompositeResponse {
  compositeResponse?: CompositeSubResponse[];
}

function toArray(value: unknown): CompositeErrorBody[] {
  if (Array.isArray(value)) {
    return value as CompositeErrorBody[];
  }

  return [];
}

function linePrefix(referenceId: string): string {
  const match = referenceId.match(/^oli_(\d+)$/);
  if (!match) {
    return "";
  }

  return `lines[${Number(match[1]) - 1}]`;
}

export function parseCompositeErrors(response: CompositeResponse): SalesforceMappedError[] {
  const mapped: SalesforceMappedError[] = [];

  for (const item of response.compositeResponse ?? []) {
    if (item.httpStatusCode < 400) {
      continue;
    }

    const errors = toArray(item.body);
    if (errors.length === 0) {
      mapped.push({
        source: "salesforce",
        field: "unknown",
        portalField: "form",
        message: `Salesforce request failed for reference ${item.referenceId}`,
        sfErrorCode: "UNKNOWN_ERROR",
        severity: "block"
      });
      continue;
    }

    for (const error of errors) {
      const field = error.fields && error.fields.length > 0 ? error.fields[0] : "unknown";
      const mappedField = fieldMap[field] ?? field;
      const linePath = linePrefix(item.referenceId);
      const portalField = linePath
        ? mappedField === field
          ? `${linePath}.${field}`
          : `${linePath}.${mappedField}`
        : mappedField;

      mapped.push({
        source: "salesforce",
        field,
        portalField,
        message: error.message ?? "Unknown Salesforce validation error",
        sfErrorCode: error.errorCode ?? "UNKNOWN_ERROR",
        severity: "block"
      });
    }
  }

  return mapped;
}