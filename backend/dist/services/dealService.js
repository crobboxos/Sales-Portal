"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeal = createDeal;
exports.updateDeal = updateDeal;
exports.getDeal = getDeal;
exports.getDealList = getDealList;
exports.addDealLine = addDealLine;
exports.updateDealLine = updateDealLine;
exports.removeDealLine = removeDealLine;
exports.getDealStatus = getDealStatus;
exports.getSubmission = getSubmission;
const env_1 = require("../config/env");
const deal_1 = require("../models/deal");
const dealRepository_1 = require("../repositories/dealRepository");
const submissionRepository_1 = require("../repositories/submissionRepository");
function applyDefaults(input) {
  return {
    ...input,
    stageName: input.stageName ?? "Open",
    linesOfBusiness: input.linesOfBusiness ?? "Software Licensing",
    fundingType: input.fundingType ?? "Subscription",
    currencyIsoCode: input.currencyIsoCode ?? "GBP",
    recordTypeId: input.recordTypeId ?? env_1.env.SF_DEFAULT_RECORD_TYPE_ID,
    pricebook2Id: input.pricebook2Id ?? env_1.env.SF_DEFAULT_PRICEBOOK_ID,
    companyErpId: input.companyErpId ?? env_1.env.SF_DEFAULT_COMPANY_ERP_ID,
    notifiy: input.notifiy ?? "No requirement",
    iwmSalesOrderReq: input.iwmSalesOrderReq ?? false,
    iwmSalesOrderType: input.iwmSalesOrderType ?? env_1.env.SF_DEFAULT_SO_TYPE,
    lines: input.lines.map((line) => ({
      ...line,
      productCondition: line.productCondition ?? "New"
    }))
  };
}
async function createDeal(body, userEmail) {
  const parsed = deal_1.dealInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid deal payload: ${JSON.stringify(parsed.error.flatten())}`
    );
  }
  const input = applyDefaults(parsed.data);
  return (0, dealRepository_1.createDealDraft)(input, userEmail);
}
async function updateDeal(dealId, body, userEmail) {
  const parsed = deal_1.dealInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid deal payload: ${JSON.stringify(parsed.error.flatten())}`
    );
  }
  const input = applyDefaults(parsed.data);
  return (0, dealRepository_1.updateDealDraft)(dealId, input, userEmail);
}
async function getDeal(dealId) {
  return (0, dealRepository_1.getDealById)(dealId);
}
async function getDealList(userEmail, status) {
  return (0, dealRepository_1.listDeals)(userEmail, status);
}
async function addDealLine(dealId, body) {
  const parsed = deal_1.dealLineInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid line payload: ${JSON.stringify(parsed.error.flatten())}`
    );
  }
  return (0, dealRepository_1.insertLineItem)(dealId, parsed.data);
}
async function updateDealLine(dealId, lineId, body) {
  const parsed = deal_1.dealLineInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid line payload: ${JSON.stringify(parsed.error.flatten())}`
    );
  }
  return (0, dealRepository_1.updateLineItem)(dealId, lineId, parsed.data);
}
async function removeDealLine(dealId, lineId) {
  return (0, dealRepository_1.deleteLineItem)(dealId, lineId);
}
async function getDealStatus(dealId) {
  const deal = await (0, dealRepository_1.getDealById)(dealId);
  if (!deal) {
    return null;
  }
  const submissions = await (0, submissionRepository_1.listSubmissions)();
  const dealSubmissions = submissions.filter(
    (submission) => submission.deal_id === dealId
  );
  return {
    deal: deal.deal,
    submissions: dealSubmissions
  };
}
async function getSubmission(submissionId) {
  return (0, submissionRepository_1.getSubmissionById)(submissionId);
}
