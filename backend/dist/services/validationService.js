"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDealForSubmit = validateDealForSubmit;
const pool_1 = require("../db/pool");
async function loadPicklists(fields) {
  const cache = {};
  for (const field of fields) {
    const key = `${field.objectApiName}.${field.fieldApiName}`;
    const result = await (0, pool_1.query)(
      `
      SELECT value
      FROM picklist_values
      WHERE object_api_name = $1
        AND field_api_name = $2
        AND is_active = TRUE;
      `,
      [field.objectApiName, field.fieldApiName]
    );
    cache[key] = new Set(result.rows.map((row) => row.value));
  }
  return cache;
}
function checkPicklist(cache, objectApiName, fieldApiName, value) {
  if (!value) {
    return false;
  }
  const key = `${objectApiName}.${fieldApiName}`;
  const values = cache[key];
  if (!values || values.size === 0) {
    return true;
  }
  return values.has(value);
}
async function lookupPricebookCurrency(pricebookEntryId) {
  const result = await (0, pool_1.query)(
    "SELECT currency_iso_code FROM pricebook_entry_ref WHERE sf_pricebook_entry_id = $1 LIMIT 1",
    [pricebookEntryId]
  );
  return result.rows[0]?.currency_iso_code ?? null;
}
async function lookupProductCategory(productId) {
  const result = await (0, pool_1.query)(
    "SELECT product_category, line_of_business FROM product_ref WHERE sf_product2_id = $1 LIMIT 1",
    [productId]
  );
  if (!result.rows[0]) {
    return null;
  }
  return result.rows[0].product_category ?? result.rows[0].line_of_business;
}
async function validateDealForSubmit(deal, lines) {
  const issues = [];
  const picklistCache = await loadPicklists([
    { objectApiName: "Opportunity", fieldApiName: "StageName" },
    { objectApiName: "Opportunity", fieldApiName: "Lines_Of_Business__c" },
    { objectApiName: "Opportunity", fieldApiName: "Funding_Type__c" },
    { objectApiName: "Opportunity", fieldApiName: "IWM_Sales_Order_Type__c" },
    { objectApiName: "Opportunity", fieldApiName: "CurrencyIsoCode" },
    {
      objectApiName: "OpportunityLineItem",
      fieldApiName: "Product_Condition__c"
    },
    {
      objectApiName: "OpportunityLineItem",
      fieldApiName: "Contract_Type_Software__c"
    },
    {
      objectApiName: "OpportunityLineItem",
      fieldApiName: "Subscription_Billing_Commitment__c"
    },
    {
      objectApiName: "OpportunityLineItem",
      fieldApiName: "Subscription_Billing_Plan__c"
    }
  ]);
  if (!deal.account_id) {
    issues.push({
      code: "V-OPP-01",
      field: "accountId",
      message: "Please select an account",
      severity: "block"
    });
  }
  if (!deal.close_date) {
    issues.push({
      code: "V-OPP-02",
      field: "closeDate",
      message: "Close date is required",
      severity: "block"
    });
  } else {
    const closeDate = new Date(deal.close_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (closeDate < today) {
      issues.push({
        code: "V-OPP-03",
        field: "closeDate",
        message: "Close date cannot be in the past",
        severity: "block"
      });
    }
  }
  if (!deal.lines_of_business) {
    issues.push({
      code: "V-OPP-04",
      field: "linesOfBusiness",
      message: "Please select a Line of Business",
      severity: "block"
    });
  }
  if (deal.lines_of_business === "Supplies") {
    issues.push({
      code: "VR-STOP-SUPPLIES",
      field: "linesOfBusiness",
      message:
        "You cannot choose Supplies. Please choose another line of business.",
      severity: "block"
    });
  }
  if (!deal.funding_type) {
    issues.push({
      code: "V-OPP-05",
      field: "fundingType",
      message: "Please select a Funding Type",
      severity: "block"
    });
  }
  if (!deal.stage_name) {
    issues.push({
      code: "V-OPP-06",
      field: "stageName",
      message: "Please select a Stage",
      severity: "block"
    });
  }
  if (
    !checkPicklist(picklistCache, "Opportunity", "StageName", deal.stage_name)
  ) {
    issues.push({
      code: "V-OPP-07",
      field: "stageName",
      message: "Invalid stage value",
      severity: "block"
    });
  }
  if (deal.stage_name === "Closed Won") {
    issues.push({
      code: "V-BIZ-03",
      field: "stageName",
      message: "Cannot submit as Closed Won for initial portal submissions.",
      severity: "block"
    });
  }
  if (!deal.currency_iso_code) {
    issues.push({
      code: "V-OPP-08",
      field: "currencyIsoCode",
      message: "Please select a currency",
      severity: "block"
    });
  }
  if (
    !checkPicklist(
      picklistCache,
      "Opportunity",
      "CurrencyIsoCode",
      deal.currency_iso_code
    )
  ) {
    issues.push({
      code: "V-OPP-08A",
      field: "currencyIsoCode",
      message: "Invalid currency value",
      severity: "block"
    });
  }
  if (
    !checkPicklist(
      picklistCache,
      "Opportunity",
      "Lines_Of_Business__c",
      deal.lines_of_business
    )
  ) {
    issues.push({
      code: "V-OPP-04A",
      field: "linesOfBusiness",
      message: "Invalid line of business value",
      severity: "block"
    });
  }
  if (
    !checkPicklist(
      picklistCache,
      "Opportunity",
      "Funding_Type__c",
      deal.funding_type
    )
  ) {
    issues.push({
      code: "V-OPP-05A",
      field: "fundingType",
      message: "Invalid funding type value",
      severity: "block"
    });
  }
  if (lines.length < 1) {
    issues.push({
      code: "V-OPP-09",
      field: "lines",
      message: "Please add at least one product line item",
      severity: "block"
    });
  }
  if (deal.iwm_sales_order_req && !deal.iwm_sales_order_type) {
    issues.push({
      code: "V-OPP-10",
      field: "iwmSalesOrderType",
      message: "Sales Order Type is required when Sales Order is requested",
      severity: "block"
    });
  }
  if (deal.iwm_sales_order_req && deal.stage_name !== "Closed Won") {
    issues.push({
      code: "VR-ION-ONLY-CW",
      field: "iwmSalesOrderReq",
      message:
        "Sales Order Required can only be true when stage is Closed Won.",
      severity: "block"
    });
  }
  if (deal.iwm_sales_order_req && !deal.deliver_to_id) {
    issues.push({
      code: "V-OPP-11",
      field: "deliverToId",
      message:
        "Deliver To contact is recommended when Sales Order is requested",
      severity: "warn"
    });
  }
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const baseField = `lines[${index}]`;
    if (!line.product2_id || !line.pricebook_entry_id) {
      issues.push({
        code: "V-OLI-01",
        field: `${baseField}.product2Id`,
        message: "Please select a product",
        severity: "block"
      });
    }
    if (line.quantity <= 0) {
      issues.push({
        code: "V-OLI-02",
        field: `${baseField}.quantity`,
        message: "Quantity must be greater than zero",
        severity: "block"
      });
    }
    if (!Number.isInteger(line.quantity)) {
      issues.push({
        code: "V-OLI-03",
        field: `${baseField}.quantity`,
        message: "Quantity must be a whole number",
        severity: "block"
      });
    }
    const unitPrice = Number(line.unit_price);
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      issues.push({
        code: "V-OLI-04",
        field: `${baseField}.unitPrice`,
        message: "Sales price is required",
        severity: "block"
      });
    }
    if (!line.product_condition) {
      issues.push({
        code: "V-OLI-05",
        field: `${baseField}.productCondition`,
        message: "Please select product condition",
        severity: "block"
      });
    }
    if (
      !checkPicklist(
        picklistCache,
        "OpportunityLineItem",
        "Product_Condition__c",
        line.product_condition
      )
    ) {
      issues.push({
        code: "V-OLI-05A",
        field: `${baseField}.productCondition`,
        message: "Invalid product condition value",
        severity: "block"
      });
    }
    const entryCurrency = await lookupPricebookCurrency(
      line.pricebook_entry_id
    );
    if (entryCurrency && entryCurrency !== deal.currency_iso_code) {
      issues.push({
        code: "V-OLI-06",
        field: `${baseField}.pricebookEntryId`,
        message: "Product currency does not match opportunity currency",
        severity: "block"
      });
    }
    if (line.discount !== null && line.discount !== undefined) {
      const discount = Number(line.discount);
      if (Number.isNaN(discount) || discount < 0 || discount > 100) {
        issues.push({
          code: "V-OLI-07",
          field: `${baseField}.discount`,
          message: "Discount must be between 0% and 100%",
          severity: "block"
        });
      }
    }
    const salesCost = Number(line.sales_cost);
    if (!Number.isNaN(salesCost) && salesCost > unitPrice) {
      issues.push({
        code: "V-OLI-08",
        field: `${baseField}.salesCost`,
        message: "Sales cost exceeds sales price and creates negative margin",
        severity: "warn"
      });
    }
    if (deal.funding_type === "Subscription" && !line.is_delivery_line) {
      if (!line.subscription_start_date) {
        issues.push({
          code: "V-SUB-01",
          field: `${baseField}.subscriptionStartDate`,
          message: "Start date is required for subscription deals",
          severity: "block"
        });
      }
      if (!line.subscription_term_months) {
        issues.push({
          code: "V-SUB-02",
          field: `${baseField}.subscriptionTermMonths`,
          message: "Term (months) is required for subscription deals",
          severity: "block"
        });
      } else if (line.subscription_term_months <= 0) {
        issues.push({
          code: "V-SUB-03",
          field: `${baseField}.subscriptionTermMonths`,
          message: "Term must be at least 1 month",
          severity: "block"
        });
      }
      if (!line.subscription_billing_commitment) {
        issues.push({
          code: "V-SUB-04",
          field: `${baseField}.subscriptionBillingCommitment`,
          message: "Billing commitment is required for subscription deals",
          severity: "block"
        });
      } else if (
        !checkPicklist(
          picklistCache,
          "OpportunityLineItem",
          "Subscription_Billing_Commitment__c",
          line.subscription_billing_commitment
        )
      ) {
        issues.push({
          code: "V-SUB-04A",
          field: `${baseField}.subscriptionBillingCommitment`,
          message: "Invalid billing commitment",
          severity: "block"
        });
      }
      if (!line.subscription_billing_plan) {
        issues.push({
          code: "V-SUB-05",
          field: `${baseField}.subscriptionBillingPlan`,
          message: "Billing plan is required for subscription deals",
          severity: "block"
        });
      } else if (
        !checkPicklist(
          picklistCache,
          "OpportunityLineItem",
          "Subscription_Billing_Plan__c",
          line.subscription_billing_plan
        )
      ) {
        issues.push({
          code: "V-SUB-05A",
          field: `${baseField}.subscriptionBillingPlan`,
          message: "Invalid billing plan",
          severity: "block"
        });
      }
      if (!line.contract_type_software) {
        issues.push({
          code: "V-SUB-06",
          field: `${baseField}.contractTypeSoftware`,
          message: "Contract type is required",
          severity: "block"
        });
      } else if (
        !checkPicklist(
          picklistCache,
          "OpportunityLineItem",
          "Contract_Type_Software__c",
          line.contract_type_software
        )
      ) {
        issues.push({
          code: "V-SUB-06A",
          field: `${baseField}.contractTypeSoftware`,
          message: "Invalid contract type",
          severity: "block"
        });
      }
    }
    if (deal.lines_of_business === "Software Licensing") {
      const productCategory = await lookupProductCategory(line.product2_id);
      if (productCategory && productCategory !== "Software Licensing") {
        issues.push({
          code: "VR-SOFTWARE-PRODUCT",
          field: `${baseField}.product2Id`,
          message:
            "Only software products can be added to Software Licensing opportunities.",
          severity: "block"
        });
      }
    }
  }
  return issues;
}
