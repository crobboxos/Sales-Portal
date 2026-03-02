export interface ProductOption {
  sfProduct2Id: string;
  name: string;
  lineOfBusiness?: string;
  productSubType?: string;
  productCategory?: string;
  sfPricebookEntryId: string;
  sfPricebook2Id: string;
  pricebookName?: string;
  currencyIsoCode: string;
  unitPrice: number;
  productCode?: string;
}

export interface AccountOption {
  sfAccountId: string;
  name: string;
  accountNumber?: string;
  billingCity?: string;
  billingPostalCode?: string;
  scmcActive?: boolean;
  scmcCustomer?: boolean;
  scmcEmail?: string;
}

export interface DealLineDraft {
  product2Id: string;
  pricebookEntryId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  productCondition: "New" | "Refurbished" | "Retained";
  salesCost?: number;
  contractTypeSoftware?: string;
  subscriptionStartDate?: string;
  subscriptionTermMonths?: number;
  subscriptionBillingCommitment?: string;
  subscriptionBillingPlan?: string;
  isDeliveryLine?: boolean;
}

export interface DealDraftPayload {
  accountId: string;
  stageName: string;
  closeDate: string;
  linesOfBusiness: string;
  fundingType: string;
  currencyIsoCode: string;
  lines: DealLineDraft[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "block" | "warn";
}