import { env } from "../config/env";
import { DealInput, dealInputSchema, dealLineInputSchema } from "../models/deal";
import {
  createDealDraft,
  deleteLineItem,
  getDealById,
  insertLineItem,
  listDeals,
  updateDealDraft,
  updateLineItem
} from "../repositories/dealRepository";
import { getSubmissionById, listSubmissions } from "../repositories/submissionRepository";

function applyDefaults(input: DealInput): DealInput {
  return {
    ...input,
    stageName: input.stageName ?? "Open",
    linesOfBusiness: input.linesOfBusiness ?? "Software Licensing",
    fundingType: input.fundingType ?? "Subscription",
    currencyIsoCode: input.currencyIsoCode ?? "GBP",
    recordTypeId: input.recordTypeId ?? env.SF_DEFAULT_RECORD_TYPE_ID,
    pricebook2Id: input.pricebook2Id ?? env.SF_DEFAULT_PRICEBOOK_ID,
    companyErpId: input.companyErpId ?? env.SF_DEFAULT_COMPANY_ERP_ID,
    notifiy: input.notifiy ?? "No requirement",
    iwmSalesOrderReq: input.iwmSalesOrderReq ?? false,
    iwmSalesOrderType: input.iwmSalesOrderType ?? env.SF_DEFAULT_SO_TYPE,
    lines: input.lines.map((line) => ({
      ...line,
      productCondition: line.productCondition ?? "New"
    }))
  };
}

export async function createDeal(body: unknown, userEmail: string): Promise<unknown> {
  const parsed = dealInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Invalid deal payload: ${JSON.stringify(parsed.error.flatten())}`);
  }

  const input = applyDefaults(parsed.data);
  return createDealDraft(input, userEmail);
}

export async function updateDeal(dealId: string, body: unknown, userEmail: string): Promise<unknown> {
  const parsed = dealInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Invalid deal payload: ${JSON.stringify(parsed.error.flatten())}`);
  }

  const input = applyDefaults(parsed.data);
  return updateDealDraft(dealId, input, userEmail);
}

export async function getDeal(dealId: string): Promise<unknown> {
  return getDealById(dealId);
}

export async function getDealList(userEmail: string, status?: string): Promise<unknown> {
  return listDeals(userEmail, status);
}

export async function addDealLine(dealId: string, body: unknown): Promise<unknown> {
  const parsed = dealLineInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Invalid line payload: ${JSON.stringify(parsed.error.flatten())}`);
  }

  return insertLineItem(dealId, parsed.data);
}

export async function updateDealLine(dealId: string, lineId: string, body: unknown): Promise<unknown> {
  const parsed = dealLineInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Invalid line payload: ${JSON.stringify(parsed.error.flatten())}`);
  }

  return updateLineItem(dealId, lineId, parsed.data);
}

export async function removeDealLine(dealId: string, lineId: string): Promise<boolean> {
  return deleteLineItem(dealId, lineId);
}

export async function getDealStatus(dealId: string): Promise<unknown> {
  const deal = await getDealById(dealId);
  if (!deal) {
    return null;
  }

  const submissions = await listSubmissions();
  const dealSubmissions = submissions.filter((submission) => submission.deal_id === dealId);

  return {
    deal: deal.deal,
    submissions: dealSubmissions
  };
}

export async function getSubmission(submissionId: string): Promise<unknown> {
  return getSubmissionById(submissionId);
}