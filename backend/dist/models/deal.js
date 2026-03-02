"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sfErrorSchema =
  exports.dealInputSchema =
  exports.dealLineInputSchema =
    void 0;
const zod_1 = require("zod");
exports.dealLineInputSchema = zod_1.z.object({
  portalLineId: zod_1.z.string().uuid().optional(),
  product2Id: zod_1.z.string().min(1),
  pricebookEntryId: zod_1.z.string().min(1),
  quantity: zod_1.z.number().int().positive(),
  unitPrice: zod_1.z.number().min(0),
  discount: zod_1.z.number().min(0).max(100).optional(),
  serviceDate: zod_1.z.string().date().optional(),
  sortOrder: zod_1.z.number().int().optional(),
  productCondition: zod_1.z
    .enum(["New", "Refurbished", "Retained"])
    .default("New"),
  salesCost: zod_1.z.number().min(0).optional(),
  contractTypeSoftware: zod_1.z.string().optional(),
  subscriptionStartDate: zod_1.z.string().date().optional(),
  subscriptionTermMonths: zod_1.z.number().int().positive().optional(),
  subscriptionBillingCommitment: zod_1.z.string().optional(),
  subscriptionBillingPlan: zod_1.z.string().optional(),
  isDeliveryLine: zod_1.z.boolean().optional()
});
exports.dealInputSchema = zod_1.z.object({
  portalDealId: zod_1.z.string().uuid().optional(),
  accountId: zod_1.z.string().min(1),
  stageName: zod_1.z.string().default("Open"),
  closeDate: zod_1.z.string().date(),
  linesOfBusiness: zod_1.z.string().default("Software Licensing"),
  fundingType: zod_1.z.string().default("Subscription"),
  currencyIsoCode: zod_1.z.string().default("GBP"),
  recordTypeId: zod_1.z.string().optional(),
  pricebook2Id: zod_1.z.string().optional(),
  companyErpId: zod_1.z.string().optional(),
  notifiy: zod_1.z.string().default("No requirement"),
  iwmSalesOrderReq: zod_1.z.boolean().default(false),
  iwmSalesOrderType: zod_1.z.string().optional(),
  deliverToId: zod_1.z.string().optional(),
  customerPurchaseOrder: zod_1.z.string().optional(),
  ownerId: zod_1.z.string().optional(),
  lines: zod_1.z.array(exports.dealLineInputSchema).min(1)
});
exports.sfErrorSchema = zod_1.z.object({
  source: zod_1.z.literal("salesforce"),
  field: zod_1.z.string(),
  portalField: zod_1.z.string(),
  message: zod_1.z.string(),
  sfErrorCode: zod_1.z.string(),
  severity: zod_1.z.enum(["block", "warn"]).default("block")
});
