import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { DealLineRecord, DealRecord, SalesforceMappedError } from "../models/deal";
import {
  attachSalesforceLineIds,
  getDealById,
  insertLineItem,
  updateDealStatus
} from "../repositories/dealRepository";
import { createAuditEvent } from "../repositories/auditRepository";
import {
  createSubmission,
  createSyncJob,
  getSubmissionById,
  updateSubmissionStatus
} from "../repositories/submissionRepository";
import { getDeliveryPricebookEntry } from "../repositories/referenceRepository";
import { parseCompositeErrors } from "./errorParser";
import { retryQueue } from "./retryQueue";
import { salesforceClient } from "./salesforceClient";
import { validateDealForSubmit } from "./validationService";

interface CompositeSubResponse {
  body: unknown;
  httpHeaders: Record<string, string>;
  httpStatusCode: number;
  referenceId: string;
}

interface CompositeResponse {
  compositeResponse: CompositeSubResponse[];
}

interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  sfOppId?: string;
  sfOppUrl?: string;
  status?: string;
  errors?: SalesforceMappedError[];
  warnings?: SalesforceMappedError[];
}

interface SalesforceReadBack {
  Id: string;
  Name: string;
  StageName: string;
  link_Opp2SO_State__c?: string;
  link_Opp2SO_Id__c?: string;
  Amount?: number;
}

interface SalesforceLineReadBack {
  Id: string;
  Portal_Line_Id__c?: string;
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
}

function isTransientCompositeFailure(response: CompositeResponse): boolean {
  return response.compositeResponse.some((item) => item.httpStatusCode >= 500);
}

function buildCompositePayload(deal: DealRecord, lines: DealLineRecord[]): unknown {
  const compositeRequest: unknown[] = [
    {
      method: "PATCH",
      url: `/services/data/v${env.SF_API_VERSION}/sobjects/Opportunity/Portal_Deal_Id__c/${deal.portal_deal_id}`,
      referenceId: "opp",
      body: {
        AccountId: deal.account_id,
        StageName: deal.stage_name,
        CloseDate: deal.close_date,
        Lines_Of_Business__c: deal.lines_of_business,
        Funding_Type__c: deal.funding_type,
        CurrencyIsoCode: deal.currency_iso_code,
        RecordTypeId: deal.record_type_id,
        Pricebook2Id: deal.pricebook2_id,
        Company_ERP__c: deal.company_erp_id,
        Estimated_Costs__c: toNumber(deal.estimated_costs),
        Estimated_Revenue__c: toNumber(deal.estimated_revenue),
        Notifiy__c: deal.notifiy,
        IWM_Sales_Order_Req__c: deal.iwm_sales_order_req,
        IWM_Sales_Order_Type__c: deal.iwm_sales_order_type,
        Deliver_To__c: deal.deliver_to_id,
        Customer_Purchase_Order__c: deal.customer_purchase_order,
        OwnerId: deal.owner_id
      }
    }
  ];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    compositeRequest.push({
      method: "PATCH",
      url: `/services/data/v${env.SF_API_VERSION}/sobjects/OpportunityLineItem/Portal_Line_Id__c/${line.portal_line_id}`,
      referenceId: `oli_${index + 1}`,
      body: {
        OpportunityId: "@{opp.id}",
        PricebookEntryId: line.pricebook_entry_id,
        Quantity: line.quantity,
        UnitPrice: toNumber(line.unit_price),
        Discount: line.discount !== null ? toNumber(line.discount) : undefined,
        ServiceDate: line.service_date,
        SortOrder: line.sort_order,
        Product_Condition__c: line.product_condition,
        Sales_Cost__c: toNumber(line.sales_cost),
        Contract_Type_Software__c: line.contract_type_software,
        Subscription_Start_Date__c: line.subscription_start_date,
        Subscription_Term_Months__c: line.subscription_term_months,
        Subscription_Billing_Commitment__c: line.subscription_billing_commitment,
        Subscription_Billing_Plan__c: line.subscription_billing_plan
      }
    });
  }

  return {
    allOrNone: true,
    compositeRequest
  };
}

async function ensureDeliveryLine(deal: DealRecord, lines: DealLineRecord[]): Promise<DealLineRecord[]> {
  const hasDeliveryLine = lines.some((line) => line.is_delivery_line);
  if (hasDeliveryLine || deal.lines_of_business !== "Software Licensing") {
    return lines;
  }

  const deliveryEntry = await getDeliveryPricebookEntry(
    env.SF_DELIVERY_PRODUCT_CODE_SOFTWARE_LICENSING,
    deal.currency_iso_code,
    deal.pricebook2_id
  );

  if (!deliveryEntry) {
    throw new Error(
      `Delivery pricebook entry not found for ${env.SF_DELIVERY_PRODUCT_CODE_SOFTWARE_LICENSING}/${deal.currency_iso_code}/${deal.pricebook2_id}`
    );
  }

  await insertLineItem(deal.id, {
    portalLineId: uuidv4(),
    product2Id: deliveryEntry.sfProduct2Id,
    pricebookEntryId: deliveryEntry.sfPricebookEntryId,
    quantity: 1,
    unitPrice: deliveryEntry.unitPrice,
    productCondition: "New",
    salesCost: 0,
    isDeliveryLine: true
  });

  const refreshed = await getDealById(deal.id);
  if (!refreshed) {
    throw new Error("Deal disappeared while creating delivery line.");
  }

  return refreshed.lines;
}

async function readBackOpportunity(portalDealId: string): Promise<SalesforceReadBack | null> {
  const soql = `
    SELECT Id, Name, StageName, link_Opp2SO_State__c, link_Opp2SO_Id__c, Amount
    FROM Opportunity
    WHERE Portal_Deal_Id__c = '${portalDealId}'
    LIMIT 1
  `;

  return salesforceClient.querySingle<SalesforceReadBack>(soql);
}

async function readBackLines(portalLineIds: string[]): Promise<SalesforceLineReadBack[]> {
  if (portalLineIds.length === 0) {
    return [];
  }

  const escaped = portalLineIds.map((id) => `'${id}'`).join(",");
  const soql = `
    SELECT Id, Portal_Line_Id__c
    FROM OpportunityLineItem
    WHERE Portal_Line_Id__c IN (${escaped})
  `;

  return salesforceClient.queryAll<SalesforceLineReadBack>(soql);
}

async function handleTransientFailure(submissionId: string, errorDetail: unknown, retryCount: number): Promise<string> {
  const nextAttempt = retryCount + 1;
  if (nextAttempt > retryQueue.maxAttempts()) {
    await updateSubmissionStatus(submissionId, "dead_letter", {
      errorDetail,
      retryCount: nextAttempt,
      markAttempted: true
    });
    return "dead_letter";
  }

  await updateSubmissionStatus(submissionId, "pending_retry", {
    errorDetail,
    retryCount: nextAttempt,
    markAttempted: true
  });

  await retryQueue.scheduleRetry(submissionId, nextAttempt);
  return "pending_retry";
}

export async function submitDeal(
  dealId: string,
  submittedBy: string,
  existingSubmissionId?: string,
  retryAttempt?: number
): Promise<SubmissionResult> {
  const payload = await getDealById(dealId);
  if (!payload) {
    throw new Error("Deal not found.");
  }

  const deal = payload.deal;
  const lines = await ensureDeliveryLine(deal, payload.lines);
  const validationIssues = await validateDealForSubmit(deal, lines);
  const blocking = validationIssues.filter((issue) => issue.severity === "block");
  const warnings = validationIssues
    .filter((issue) => issue.severity === "warn")
    .map((issue) => ({
      source: "salesforce" as const,
      field: issue.field,
      portalField: issue.field,
      message: issue.message,
      sfErrorCode: issue.code,
      severity: "warn" as const
    }));

  if (blocking.length > 0) {
    return {
      success: false,
      status: "validation_failed",
      errors: blocking.map((issue) => ({
        source: "salesforce" as const,
        field: issue.field,
        portalField: issue.field,
        message: issue.message,
        sfErrorCode: issue.code,
        severity: "block" as const
      })),
      warnings
    };
  }

  if (!salesforceClient.isConfigured()) {
    return {
      success: false,
      status: "salesforce_unconfigured",
      errors: [
        {
          source: "salesforce",
          field: "form",
          portalField: "form",
          message: "Salesforce credentials are missing. Configure SF_CLIENT_ID/SF_USERNAME/SF_PRIVATE_KEY.",
          sfErrorCode: "SF_AUTH_CONFIG_MISSING",
          severity: "block"
        }
      ],
      warnings
    };
  }

  const submission = existingSubmissionId
    ? await getSubmissionById(existingSubmissionId)
    : await createSubmission(deal.id, submittedBy);

  if (!submission) {
    throw new Error("Submission not found.");
  }

  await updateSubmissionStatus(submission.id, "pending", {
    retryCount: submission.retry_count,
    markAttempted: Boolean(existingSubmissionId)
  });

  await updateDealStatus(deal.id, "pending_submission", { markSubmitted: true });
  await createAuditEvent({
    entityType: "submission",
    entityId: submission.id,
    action: "submit_requested",
    userId: submittedBy,
    metadata: {
      dealId: deal.id,
      portalDealId: deal.portal_deal_id,
      retryAttempt: retryAttempt ?? 0
    }
  });

  const compositePayload = buildCompositePayload(deal, lines);

  try {
    const response = await salesforceClient.composite<CompositeResponse>(compositePayload);
    const errors = parseCompositeErrors(response);

    if (errors.length > 0) {
      const transient = isTransientCompositeFailure(response);
      const status = transient
        ? await handleTransientFailure(submission.id, { errors, response }, submission.retry_count)
        : "failed";

      if (!transient) {
        await updateSubmissionStatus(submission.id, status, {
          errorDetail: { errors, response },
          markAttempted: true
        });
      }

      await updateDealStatus(deal.id, "failed");
      await createSyncJob({
        submissionId: submission.id,
        direction: "out",
        objectType: "OpportunityComposite",
        status: status,
        attemptCount: submission.retry_count,
        payload: compositePayload,
        lastError: JSON.stringify(errors)
      });
      await createAuditEvent({
        entityType: "submission",
        entityId: submission.id,
        action: "submit_failed",
        userId: submittedBy,
        payloadDiff: { errors },
        metadata: { transient, status }
      });

      return {
        success: false,
        submissionId: submission.id,
        status,
        errors,
        warnings
      };
    }

    const readBack = await readBackOpportunity(deal.portal_deal_id);
    if (!readBack) {
      throw new Error("Salesforce composite succeeded but opportunity read-back returned no record.");
    }

    const lineIds = lines.map((line) => line.portal_line_id);
    const lineReadBack = await readBackLines(lineIds);
    const lineIdMap = new Map<string, string>();
    for (const line of lineReadBack) {
      if (line.Portal_Line_Id__c) {
        lineIdMap.set(line.Portal_Line_Id__c, line.Id);
      }
    }

    await attachSalesforceLineIds(lineIdMap);

    await updateDealStatus(deal.id, "synced", {
      sfOpportunityId: readBack.Id,
      sfOpportunityName: readBack.Name,
      linkOpp2SoState: readBack.link_Opp2SO_State__c,
      linkOpp2SoId: readBack.link_Opp2SO_Id__c
    });

    await updateSubmissionStatus(submission.id, "synced", {
      sfOpportunityId: readBack.Id,
      retryCount: submission.retry_count,
      markAttempted: true
    });

    await createSyncJob({
      submissionId: submission.id,
      direction: "out",
      objectType: "Opportunity",
      sfRecordId: readBack.Id,
      status: "completed",
      attemptCount: submission.retry_count,
      payload: compositePayload
    });

    for (const line of lines) {
      await createSyncJob({
        submissionId: submission.id,
        direction: "out",
        objectType: "OpportunityLineItem",
        sfRecordId: lineIdMap.get(line.portal_line_id),
        status: "completed",
        attemptCount: submission.retry_count,
        payload: {
          portalLineId: line.portal_line_id
        }
      });
    }

    await createAuditEvent({
      entityType: "submission",
      entityId: submission.id,
      action: "submit_succeeded",
      userId: submittedBy,
      metadata: {
        sfOppId: readBack.Id,
        sfOppName: readBack.Name,
        lineCount: lines.length
      }
    });

    return {
      success: true,
      submissionId: submission.id,
      sfOppId: readBack.Id,
      sfOppUrl: `${env.SF_LOGIN_URL}/lightning/r/Opportunity/${readBack.Id}/view`,
      status: "synced",
      warnings
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const transient = /timeout|ECONNRESET|ECONNREFUSED|5\d\d/.test(message);

    if (transient) {
      const status = await handleTransientFailure(submission.id, { message }, submission.retry_count);
      await updateDealStatus(deal.id, "pending_retry");

      await createAuditEvent({
        entityType: "submission",
        entityId: submission.id,
        action: "submit_retry_scheduled",
        userId: submittedBy,
        metadata: { error: message, status }
      });

      return {
        success: false,
        submissionId: submission.id,
        status,
        errors: [
          {
            source: "salesforce",
            field: "form",
            portalField: "form",
            message,
            sfErrorCode: "SF_TRANSIENT_ERROR",
            severity: "block"
          }
        ],
        warnings
      };
    }

    await updateSubmissionStatus(submission.id, "failed", {
      errorDetail: { message },
      markAttempted: true
    });
    await updateDealStatus(deal.id, "failed");
    await createSyncJob({
      submissionId: submission.id,
      direction: "out",
      objectType: "OpportunityComposite",
      status: "failed",
      attemptCount: submission.retry_count,
      payload: compositePayload,
      lastError: message
    });
    await createAuditEvent({
      entityType: "submission",
      entityId: submission.id,
      action: "submit_failed_exception",
      userId: submittedBy,
      metadata: { error: message }
    });

    return {
      success: false,
      submissionId: submission.id,
      status: "failed",
      errors: [
        {
          source: "salesforce",
          field: "form",
          portalField: "form",
          message,
          sfErrorCode: "SF_SUBMIT_EXCEPTION",
          severity: "block"
        }
      ],
      warnings
    };
  }
}

export async function retrySubmission(submissionId: string, attempt: number, userId = "system-retry"): Promise<void> {
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    throw new Error(`Submission ${submissionId} not found.`);
  }

  const dealPayload = await getDealById(submission.deal_id);
  if (!dealPayload) {
    throw new Error(`Deal ${submission.deal_id} not found for submission ${submissionId}.`);
  }

  await createAuditEvent({
    entityType: "submission",
    entityId: submission.id,
    action: "retry_attempt_started",
    userId,
    metadata: {
      attempt
    }
  });

  const result = await submitDeal(submission.deal_id, userId, submission.id, attempt);

  await createAuditEvent({
    entityType: "submission",
    entityId: submission.id,
    action: "retry_attempt_completed",
    userId,
    metadata: {
      attempt,
      success: result.success,
      status: result.status
    }
  });
}
