# Validation Rules & Workflow Rules

> **Version:** 0.1-draft  
> **Date:** 2026-03-02  
> **Status:** ⚠️ Partial — Salesforce validation rules not yet retrieved from org (see §5)

---

## 1. Portal-Side Validation (Pre-Submit)

These rules run in the portal **before** any Salesforce API call. They mirror known SF requirements
and provide instant feedback to the salesperson.

### 1.1 Opportunity Header Validation

| #        | Rule                                                | Field(s)                                            | Error Message                                                                    | Severity |
| -------- | --------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| V-OPP-01 | Account is required                                 | `AccountId`                                         | "Please select an account"                                                       | Block    |
| V-OPP-02 | Close Date is required                              | `CloseDate`                                         | "Close date is required"                                                         | Block    |
| V-OPP-03 | Close Date must be in the future (or today)         | `CloseDate`                                         | "Close date cannot be in the past"                                               | Block    |
| V-OPP-04 | Line of Business is required                        | `Lines_Of_Business__c`                              | "Please select a Line of Business"                                               | Block    |
| V-OPP-05 | Funding Type is required                            | `Funding_Type__c`                                   | "Please select a Funding Type"                                                   | Block    |
| V-OPP-06 | Stage is required                                   | `StageName`                                         | "Please select a Stage"                                                          | Block    |
| V-OPP-07 | Stage must be a valid picklist value                | `StageName`                                         | "Invalid stage value"                                                            | Block    |
| V-OPP-08 | Currency is required (multi-currency org)           | `CurrencyIsoCode`                                   | "Please select a currency"                                                       | Block    |
| V-OPP-09 | At least one line item is required                  | (aggregate)                                         | "Please add at least one product line item"                                      | Block    |
| V-OPP-10 | Sales Order Type required when SO Req is true       | `IWM_Sales_Order_Type__c`, `IWM_Sales_Order_Req__c` | "Sales Order Type is required when Sales Order is requested"                     | Block    |
| V-OPP-11 | Deliver To contact should exist when SO Req is true | `Deliver_To__c`, `IWM_Sales_Order_Req__c`           | "Deliver To contact is recommended for Sales Order creation"                     | Warn     |
| V-OPP-12 | Account must be active for SO creation              | Account.`SCMC__Active__c`                           | "Selected account is not active — Sales Order will not be created automatically" | Warn     |

### 1.2 Line Item Validation

| #        | Rule                                     | Field(s)                          | Error Message                                          | Severity |
| -------- | ---------------------------------------- | --------------------------------- | ------------------------------------------------------ | -------- |
| V-OLI-01 | Product is required                      | `Product2Id` / `PricebookEntryId` | "Please select a product"                              | Block    |
| V-OLI-02 | Quantity is required and > 0             | `Quantity`                        | "Quantity must be greater than zero"                   | Block    |
| V-OLI-03 | Quantity must be a whole number          | `Quantity`                        | "Quantity must be a whole number"                      | Block    |
| V-OLI-04 | Unit Price is required and ≥ 0           | `UnitPrice`                       | "Sales price is required"                              | Block    |
| V-OLI-05 | Product Condition is required            | `Product_Condition__c`            | "Please select product condition"                      | Block    |
| V-OLI-06 | PricebookEntry must match Opp currency   | `CurrencyIsoCode`                 | "Product currency does not match opportunity currency" | Block    |
| V-OLI-07 | Discount must be 0-100 if provided       | `Discount`                        | "Discount must be between 0% and 100%"                 | Block    |
| V-OLI-08 | Sales Cost should not exceed Sales Price | `Sales_Cost__c`, `UnitPrice`      | "Sales cost exceeds sales price — negative margin"     | Warn     |

### 1.3 Subscription-Specific Validation

| #        | Rule                                                      | Field(s)                             | Error Message                                           | Severity |
| -------- | --------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------- | -------- |
| V-SUB-01 | Subscription Start Date required for subscription funding | `Subscription_Start_Date__c`         | "Start date is required for subscription deals"         | Block    |
| V-SUB-02 | Subscription Term required for subscription funding       | `Subscription_Term__c`               | "Term (months) is required for subscription deals"      | Block    |
| V-SUB-03 | Subscription Term must be > 0                             | `Subscription_Term__c`               | "Term must be at least 1 month"                         | Block    |
| V-SUB-04 | Billing Commitment required for subscription              | `Subscription_Billing_Commitment__c` | "Billing commitment is required for subscription deals" | Block    |
| V-SUB-05 | Billing Plan required for subscription                    | `Subscription_Billing_Plan__c`       | "Billing plan is required for subscription deals"       | Block    |
| V-SUB-06 | Contract Type required                                    | `Contract_Type__c`                   | "Contract type is required"                             | Block    |

> **Conditional trigger:** V-SUB-01 through V-SUB-05 only enforce when `Funding_Type__c` = 'Subscription' (or equivalent value — needs picklist confirmation).

### 1.4 Business Logic Validation

| #        | Rule                                              | Field(s)                             | Error Message                                        | Severity |
| -------- | ------------------------------------------------- | ------------------------------------ | ---------------------------------------------------- | -------- |
| V-BIZ-01 | Subscription value ≠ monthly GP                   | `Funding_Type__c`, calculated amount | —                                                    | Logic    |
| V-BIZ-02 | Portal must tag Track 1 vs Track 2                | `Funding_Type__c`                    | —                                                    | Logic    |
| V-BIZ-03 | Do not allow "Closed Won" stage on initial submit | `StageName`                          | "Cannot submit as Closed Won — use an earlier stage" | Block    |

> **V-BIZ-01 / V-BIZ-02:** These are reporting rules, not field validations. The portal must ensure that when `Funding_Type__c` = 'Subscription', the deal's contract value is stored as _potential_ annual revenue (Track 1) and is **never** mixed into realised monthly GP (Track 2).

---

## 2. Salesforce-Side Automation That Acts as Implicit Validation

These are not validation rules per se, but automation that will **change data** after the portal inserts. The portal must account for them.

### 2.1 Opportunity Name Override

| Automation        | `Opportunity_Naming_Convention` (RecordBeforeSave)                     |
| ----------------- | ---------------------------------------------------------------------- |
| **Behavior**      | Overwrites `Name` with: `{Account_Number}/{counter}/{Quarter}/{LOB}`   |
| **Portal impact** | Portal should NOT set `Name`. If it does, the flow overrides it.       |
| **Implication**   | After insert, portal must read-back `Name` to display the final value. |

### 2.2 Owner Override

| Automation        | `Set_Opportunity_Owner` (RecordBeforeSave)                            |
| ----------------- | --------------------------------------------------------------------- |
| **Behavior**      | May reassign `OwnerId` based on `Lines_Of_Business__c`                |
| **Portal impact** | Portal sets `OwnerId` to the submitting user, but SF may override.    |
| **Implication**   | Read-back `OwnerId` after insert. If changed, display a notification. |

### 2.3 Sales Order Creation Guard

| Automation         | `ION_CreateSalesOrder_PB_2` (RecordAfterSave)                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Entry criteria** | `StageName = 'Closed Won'` AND `IWM_Sales_Order_Req__c = true` AND `link_Opp2SO_State__c ≠ 'Ok'` |
| **Portal impact**  | If portal sets stage to Closed Won + SO req = true, a Sales Order is immediately created.        |
| **Guard**          | Portal should NOT submit at Closed Won stage initially. Use "Qualification" or "Proposal" stage. |

### 2.4 Account Activation

| Automation        | `ION_CreateSalesOrder_PB_2` (RecordAfterSave)                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Behavior**      | If Account is not active (`SCMC__Active__c = false` or `SCMC__Customer__c = false` or no email), the flow activates the account. |
| **Portal impact** | Not a blocker, but portal should warn if account appears inactive.                                                               |

### 2.5 Contractual Split Calculation

| Automation        | `Opportunity_Calculate_Contractual_Split` (RecordAfterSave)                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Behavior**      | Calculates `Sales_Person_Deal_Revenue__c` and `Sales_Person_Deal_Profit__c` on OpportunitySplit using `Contractual_Revenue__c` and `Contractual_Profit__c` |
| **Portal impact** | Portal should populate `Contractual_Revenue__c` and `Contractual_Profit__c` if applicable.                                                                 |

---

## 3. Known Apex Trigger Behavior

### 3.1 OppSyncTrigger (after update on Opportunity)

- Syncs Opportunity field changes to the synced Quote.
- **Portal-created Opportunities should NOT have a synced Quote**, so this trigger will be a no-op.
- **Risk:** Low. The trigger checks `SyncedQuoteId != null` before doing anything.

### 3.2 OppLineSyncTrigger (before insert, after insert, after update on OLI)

- **Before insert:** Calls `QuoteSyncUtil.populateRequiredFields()` only in test context (`isRunningTest`). In production, this is a no-op — **portal must supply all required OLI fields**.
- **After insert/update:** Syncs OLI changes to QuoteLineItem. Safe — no synced Quote.

### 3.3 DLRS Triggers

- `dlrs_OpportunityTrigger` and `dlrs_OpportunityLineItemTrigger` fire on all events.
- They execute Declarative Lookup Rollup Summaries — read-only aggregation.
- **Portal impact:** None, but they add to processing time. Budget 3-5 seconds per API call for SF to settle.

---

## 4. Picklist Validation Strategy

The portal must validate that submitted picklist values are valid SF picklist entries. Strategy:

```
On startup / nightly:
  1. Call SF Describe API for Opportunity and OpportunityLineItem
  2. Cache picklist values in portal DB:
     - table: picklist_values(object, field, value, label, is_active, is_default)
  3. Serve from cache via GET /api/picklists/:object/:field

On form submit:
  1. Validate each picklist field value against cached values
  2. If invalid → block submit with field-level error
  3. If cache is stale (>24h) → refresh from SF before validating
```

**Picklist fields to cache:**

| Object              | Field                                | Urgency          |
| ------------------- | ------------------------------------ | ---------------- |
| Opportunity         | `StageName`                          | Critical         |
| Opportunity         | `Lines_Of_Business__c`               | Critical         |
| Opportunity         | `Funding_Type__c`                    | Critical         |
| Opportunity         | `IWM_Sales_Order_Type__c`            | High             |
| Opportunity         | `CurrencyIsoCode`                    | High             |
| OpportunityLineItem | `Product_Condition__c`               | Critical         |
| OpportunityLineItem | `Contract_Type__c`                   | High (if exists) |
| OpportunityLineItem | `Subscription_Billing_Commitment__c` | High (if exists) |
| OpportunityLineItem | `Subscription_Billing_Plan__c`       | High (if exists) |

---

## 5. Salesforce Validation Rules — Not Yet Retrieved

> ⚠️ **The org's Validation Rules on Opportunity and OpportunityLineItem have NOT been retrieved yet.**
> These could block API inserts with errors that the portal doesn't expect.

**To retrieve:**

```powershell
# Retrieve validation rules
sf project retrieve start --target-org xeretec-sandfull01 `
  --metadata "ValidationRule:Opportunity.*" `
  --metadata "ValidationRule:OpportunityLineItem.*" `
  --output-dir config/validation-rules `
  --wait 120
```

**After retrieval, update this document with:**

- Each validation rule's active status
- The error condition formula
- The error message
- Which fields are involved
- Whether the portal can/should replicate the rule client-side

---

## 6. Validation Execution Order

```
User clicks "Submit" in portal
    │
    ▼
┌─────────────────────────────────────────┐
│  1. Client-side validation (instant)     │
│     - Required fields present            │
│     - Type checks (number, date, etc.)   │
│     - Picklist values valid              │
│     - Subscription rules (conditional)   │
│                                          │
│  ✗ → Show inline field errors            │
│  ✓ → Continue                            │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│  2. Server-side validation (API layer)   │
│     - Re-validate all client rules       │
│     - Cross-field business rules         │
│     - Idempotency check (duplicate?)     │
│     - Picklist freshness check           │
│                                          │
│  ✗ → Return structured error response    │
│  ✓ → Continue                            │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│  3. Salesforce API call                  │
│     - Composite upsert                   │
│     - SF runs its own validation rules   │
│     - SF runs before-save flows          │
│     - SF runs triggers                   │
│                                          │
│  ✗ → Parse SF error response             │
│       Map SF field errors → portal fields│
│       Return to user with detail         │
│  ✓ → Store SF IDs, mark synced           │
└─────────────────────────────────────────┘
```

---

## 7. SF Error Response Parsing

When SF returns validation errors, the portal must parse them into user-friendly messages:

```json
// SF composite error response
{
  "compositeResponse": [
    {
      "referenceId": "opp",
      "httpStatusCode": 400,
      "body": [
        {
          "errorCode": "FIELD_CUSTOM_VALIDATION_EXCEPTION",
          "message": "Close Date cannot be more than 12 months in the future",
          "fields": ["CloseDate"]
        }
      ]
    }
  ]
}
```

**Portal parses this into:**

```json
{
  "success": false,
  "errors": [
    {
      "source": "salesforce",
      "field": "CloseDate",
      "portalField": "closeDate",
      "message": "Close Date cannot be more than 12 months in the future",
      "sfErrorCode": "FIELD_CUSTOM_VALIDATION_EXCEPTION"
    }
  ]
}
```

**Field name mapping table (SF → Portal):**

| SF Field               | Portal Form Field           | UI Label          |
| ---------------------- | --------------------------- | ----------------- |
| `AccountId`            | `accountId`                 | Account           |
| `StageName`            | `stage`                     | Stage             |
| `CloseDate`            | `closeDate`                 | Close Date        |
| `Lines_Of_Business__c` | `lineOfBusiness`            | Line of Business  |
| `Funding_Type__c`      | `fundingType`               | Funding Type      |
| `CurrencyIsoCode`      | `currency`                  | Currency          |
| `Quantity`             | `lines[n].quantity`         | Quantity          |
| `UnitPrice`            | `lines[n].unitPrice`        | Sales Price       |
| `Product_Condition__c` | `lines[n].productCondition` | Product Condition |
