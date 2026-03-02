import { DealDraftPayload, ValidationError } from "./types";

export function validateDraft(payload: DealDraftPayload): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!payload.accountId) {
    errors.push({ field: "accountId", message: "Please select an account", severity: "block" });
  }

  if (!payload.closeDate) {
    errors.push({ field: "closeDate", message: "Close date is required", severity: "block" });
  } else {
    const closeDate = new Date(payload.closeDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (closeDate < today) {
      errors.push({ field: "closeDate", message: "Close date cannot be in the past", severity: "block" });
    }
  }

  if (!payload.linesOfBusiness) {
    errors.push({ field: "linesOfBusiness", message: "Please select a line of business", severity: "block" });
  }

  if (!payload.fundingType) {
    errors.push({ field: "fundingType", message: "Please select a funding type", severity: "block" });
  }

  if (!payload.stageName) {
    errors.push({ field: "stageName", message: "Please select a stage", severity: "block" });
  }

  if (payload.stageName === "Closed Won") {
    errors.push({
      field: "stageName",
      message: "Cannot submit as Closed Won for initial portal submissions.",
      severity: "block"
    });
  }

  if (!payload.currencyIsoCode) {
    errors.push({ field: "currencyIsoCode", message: "Please select a currency", severity: "block" });
  }

  if (!payload.lines.length) {
    errors.push({ field: "lines", message: "Please add at least one product line item", severity: "block" });
  }

  payload.lines.forEach((line, index) => {
    const path = `lines[${index}]`;

    if (!line.product2Id || !line.pricebookEntryId) {
      errors.push({ field: `${path}.product2Id`, message: "Please select a product", severity: "block" });
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      errors.push({ field: `${path}.quantity`, message: "Quantity must be a whole number above zero", severity: "block" });
    }

    if (line.unitPrice < 0) {
      errors.push({ field: `${path}.unitPrice`, message: "Unit price cannot be negative", severity: "block" });
    }

    if (!line.productCondition) {
      errors.push({ field: `${path}.productCondition`, message: "Product condition is required", severity: "block" });
    }

    if (line.discount !== undefined && (line.discount < 0 || line.discount > 100)) {
      errors.push({ field: `${path}.discount`, message: "Discount must be between 0 and 100", severity: "block" });
    }

    if (line.salesCost !== undefined && line.salesCost > line.unitPrice) {
      errors.push({
        field: `${path}.salesCost`,
        message: "Sales cost exceeds sales price and creates negative margin",
        severity: "warn"
      });
    }

    if (payload.fundingType === "Subscription" && !line.isDeliveryLine) {
      if (!line.subscriptionStartDate) {
        errors.push({
          field: `${path}.subscriptionStartDate`,
          message: "Subscription start date is required",
          severity: "block"
        });
      }

      if (!line.subscriptionTermMonths || line.subscriptionTermMonths <= 0) {
        errors.push({
          field: `${path}.subscriptionTermMonths`,
          message: "Subscription term must be greater than zero",
          severity: "block"
        });
      }

      if (!line.subscriptionBillingCommitment) {
        errors.push({
          field: `${path}.subscriptionBillingCommitment`,
          message: "Billing commitment is required",
          severity: "block"
        });
      }

      if (!line.subscriptionBillingPlan) {
        errors.push({
          field: `${path}.subscriptionBillingPlan`,
          message: "Billing plan is required",
          severity: "block"
        });
      }

      if (!line.contractTypeSoftware) {
        errors.push({ field: `${path}.contractTypeSoftware`, message: "Contract type is required", severity: "block" });
      }
    }
  });

  return errors;
}