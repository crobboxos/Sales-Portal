import { z } from "zod";

export const dealLineInputSchema = z.object({
  portalLineId: z.string().uuid().optional(),
  product2Id: z.string().min(1),
  pricebookEntryId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).optional(),
  serviceDate: z.string().date().optional(),
  sortOrder: z.number().int().optional(),
  productCondition: z.enum(["New", "Refurbished", "Retained"]).default("New"),
  salesCost: z.number().min(0).optional(),
  contractTypeSoftware: z.string().optional(),
  subscriptionStartDate: z.string().date().optional(),
  subscriptionTermMonths: z.number().int().positive().optional(),
  subscriptionBillingCommitment: z.string().optional(),
  subscriptionBillingPlan: z.string().optional(),
  isDeliveryLine: z.boolean().optional()
});

export const dealInputSchema = z.object({
  portalDealId: z.string().uuid().optional(),
  accountId: z.string().min(1),
  stageName: z.string().default("Open"),
  closeDate: z.string().date(),
  linesOfBusiness: z.string().default("Software Licensing"),
  fundingType: z.string().default("Subscription"),
  currencyIsoCode: z.string().default("GBP"),
  recordTypeId: z.string().optional(),
  pricebook2Id: z.string().optional(),
  companyErpId: z.string().optional(),
  notifiy: z.string().default("No requirement"),
  iwmSalesOrderReq: z.boolean().default(false),
  iwmSalesOrderType: z.string().optional(),
  deliverToId: z.string().optional(),
  customerPurchaseOrder: z.string().optional(),
  ownerId: z.string().optional(),
  lines: z.array(dealLineInputSchema).min(1)
});

export const sfErrorSchema = z.object({
  source: z.literal("salesforce"),
  field: z.string(),
  portalField: z.string(),
  message: z.string(),
  sfErrorCode: z.string(),
  severity: z.enum(["block", "warn"]).default("block")
});

export type DealInput = z.infer<typeof dealInputSchema>;
export type DealLineInput = z.infer<typeof dealLineInputSchema>;
export type SalesforceMappedError = z.infer<typeof sfErrorSchema>;

export interface DealRecord {
  id: string;
  portal_deal_id: string;
  sf_opportunity_id: string | null;
  sf_opportunity_name: string | null;
  status: string;
  account_id: string;
  stage_name: string;
  close_date: string;
  lines_of_business: string;
  funding_type: string;
  currency_iso_code: string;
  record_type_id: string;
  pricebook2_id: string;
  company_erp_id: string;
  estimated_costs: string;
  estimated_revenue: string;
  notifiy: string;
  iwm_sales_order_req: boolean;
  iwm_sales_order_type: string;
  deliver_to_id: string | null;
  customer_purchase_order: string | null;
  owner_id: string | null;
  created_by: string;
  updated_by: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealLineRecord {
  id: string;
  deal_id: string;
  portal_line_id: string;
  sf_oli_id: string | null;
  product2_id: string;
  pricebook_entry_id: string;
  quantity: number;
  unit_price: string;
  discount: string | null;
  service_date: string | null;
  sort_order: number | null;
  product_condition: string;
  sales_cost: string;
  contract_type_software: string | null;
  subscription_start_date: string | null;
  subscription_term_months: number | null;
  subscription_billing_commitment: string | null;
  subscription_billing_plan: string | null;
  is_delivery_line: boolean;
  created_at: string;
  updated_at: string;
}