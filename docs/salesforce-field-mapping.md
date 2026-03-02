# Salesforce Field Mapping Specification

> **Version:** 0.1-draft  
> **Date:** 2026-03-02  
> **Source:** Flow metadata analysis, trigger inspection, ERD relationships  
> **Status:** ⚠️ Partial — full field describe pending (see [solution-overview.md](solution-overview.md) §11)

---

## 1. Opportunity Header Fields

### 1.1 Standard Fields (Required for Insert)

| SF API Name       | Type                  | Portal Field             | Required                 | Notes                                                                                                                    |
| ----------------- | --------------------- | ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `Name`            | String(120)           | _Auto-generated_         | Yes (but auto-set)       | **Do NOT set from portal.** `Opportunity_Naming_Convention` flow generates: `{Account_Number}/{counter}/{Quarter}/{LOB}` |
| `AccountId`       | Reference(Account)    | Account selector         | Yes                      | Lookup from portal AccountRef cache                                                                                      |
| `StageName`       | Picklist              | Stage dropdown           | Yes                      | Picklist values TBC — likely: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost                 |
| `CloseDate`       | Date                  | Close date picker        | Yes                      | Used in naming convention (quarter calc)                                                                                 |
| `Pricebook2Id`    | Reference(Pricebook2) | Auto-set / dropdown      | Yes (for OLIs)           | Must match PricebookEntry records. Query active pricebooks to populate.                                                  |
| `CurrencyIsoCode` | Picklist              | Currency selector        | Yes (multi-currency org) | Must match PricebookEntry.CurrencyIsoCode                                                                                |
| `OwnerId`         | Reference(User)       | Auto-set to current user | Yes                      | Set to authenticated salesperson's SF User ID                                                                            |
| `Amount`          | Currency              | _Calculated_             | —                        | Auto-calculated by SF from OLI totals                                                                                    |

### 1.2 Custom Fields — Discovered from Flows

| SF API Name                  | Type (inferred)    | Portal Field              | Required              | Source Flow / Trigger                                                                                               |
| ---------------------------- | ------------------ | ------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Lines_Of_Business__c`       | Picklist           | Line of Business dropdown | Yes                   | `Opportunity_Naming_Convention`, `Set_Opportunity_Owner`, `Technical_Evaluation`, `Checklist_Creation`, many others |
| `Funding_Type__c`            | Picklist           | Funding Type dropdown     | Yes                   | `Create_Commission_Opp_Product`, `Create_Commission_Opp_Split`, `Update_Commission_Opportunity`, `Display_Contacts` |
| `Contractual_Revenue__c`     | Currency           | Contractual Revenue       | Likely                | `Opportunity_Calculate_Contractual_Split` — used to calc split revenue                                              |
| `Contractual_Profit__c`      | Currency           | Contractual Profit        | Likely                | `Opportunity_Calculate_Contractual_Split` — used to calc split profit                                               |
| `Approval_Status__c`         | Picklist           | _Set by approval process_ | —                     | `Opportunity_Compliance_Calculation` fires when = 'Approved'                                                        |
| `Customer_Purchase_Order__c` | String             | Customer PO Number        | Optional              | `Update_SO_from_Opp` copies to Sales Order                                                                          |
| `Deliver_To__c`              | Reference(Contact) | Deliver To contact        | Optional              | `Update_SO_from_Opp` and `ION_CreateSalesOrder_PB_2` use this                                                       |
| `IWM_Sales_Order_Req__c`     | Boolean            | Sales Order Required      | Yes (for SO creation) | `ION_CreateSalesOrder_PB_2` entry criteria                                                                          |
| `IWM_Sales_Order_Type__c`    | Picklist           | Sales Order Type          | Conditional           | `ION_CreateSalesOrder_PB` fires on change                                                                           |
| `link_Opp2SO_State__c`       | Picklist/String    | _Read-only_               | —                     | Set by SF automation. Portal reads to check SO creation status                                                      |
| `link_Opp2SO_Id__c`          | Reference          | _Read-only_               | —                     | Lookup to Sales Order. Set by automation                                                                            |
| `Technical_Approver__c`      | Reference(User)    | _Set by approval process_ | —                     | `Technical_Evaluation` flow checks this                                                                             |

### 1.3 Lines of Business — Picklist Values (from flow analysis)

Values observed in flow decision logic:

| Value               | Reference                                                                       |
| ------------------- | ------------------------------------------------------------------------------- |
| `Print`             | `Parent_MACD_Add` → "Check for Print → Print LOB"                               |
| `Digital Workspace` | `Technical_Evaluation` → IF condition                                           |
| `Cyber Security`    | `Technical_Evaluation` → IF condition                                           |
| `H/W` (Hardware)    | `Technical_Evaluation` → "Check for H/W" (on Product_Category, but implies LOB) |
| `Software`          | Assumed for this portal — **needs confirmation**                                |

> ⚠️ **Full picklist values required.** Run: `sf sobject describe Opportunity --json` and extract `Lines_Of_Business__c` picklist.

---

## 2. OpportunityLineItem Fields

### 2.1 Standard Fields

| SF API Name        | Type                      | Portal Field                     | Required | Notes                                           |
| ------------------ | ------------------------- | -------------------------------- | -------- | ----------------------------------------------- |
| `OpportunityId`    | Reference(Opportunity)    | _Auto-set_                       | Yes      | From parent Opportunity                         |
| `PricebookEntryId` | Reference(PricebookEntry) | _Resolved from product selector_ | Yes      | Must match Opp's Pricebook2Id + CurrencyIsoCode |
| `Product2Id`       | Reference(Product2)       | Product selector                 | Yes      | Via PricebookEntry                              |
| `Quantity`         | Number                    | Quantity input                   | Yes      |                                                 |
| `UnitPrice`        | Currency                  | Sales Price                      | Yes      | Can default from PricebookEntry.UnitPrice       |
| `Discount`         | Percent                   | Discount %                       | Optional |                                                 |
| `ServiceDate`      | Date                      | Service Date                     | Optional | Used in OppLineSyncTrigger matching             |
| `SortOrder`        | Integer                   | _Auto / drag-order_              | Optional | Used in Quote sync matching                     |
| `Name`             | String                    | _Display only_                   | —        | Auto-populated from Product2.Name               |

### 2.2 Custom Fields — Discovered from Flows

| SF API Name                    | Type (inferred)     | Portal Field            | Required    | Source                                                                      |
| ------------------------------ | ------------------- | ----------------------- | ----------- | --------------------------------------------------------------------------- |
| `Product_Condition__c`         | Picklist            | Product Condition       | Yes         | `Opportunity_Add_Products`, `Create_Parent_Product` — set to "New" in flows |
| `Parent_Product_ID__c`         | Reference(Product2) | _Auto-set for children_ | Conditional | `Opportunity_Add_Products` — links accessory/MS to parent                   |
| `Parent_Product_Process__c`    | Boolean             | _Auto-set_              | —           | Set to true by parent product generator                                     |
| `Opportunity_Product_Group__c` | Number              | _Auto-set_              | —           | Counter for product grouping                                                |
| `Group__c`                     | Number/String       | _Auto-set_              | —           | Grouping field, sorted DESC in `Get_Opportunity_Product`                    |
| `IWM_Sales_Order_Line_type__c` | Picklist            | SO Line Type            | Conditional | `ION_UpdateOppProduct` reads this to set SO Line RecordType                 |
| `IWM_SOLineRecTypeId__c`       | String              | _Auto-set_              | —           | Set by `ION_UpdateOppProduct` flow                                          |

### 2.3 Subscription-Specific Fields (from user requirements)

> ⚠️ **These fields are specified in the business requirements but were NOT found in discovered flow metadata.**  
> They may exist on the org but not be referenced in active flows, OR they may need to be created.

| Expected SF API Name                 | Type            | Portal Field       | Required            | Status                                                            |
| ------------------------------------ | --------------- | ------------------ | ------------------- | ----------------------------------------------------------------- |
| `Sales_Cost__c` (or `Cost_Price__c`) | Currency        | Sales Cost         | Yes for margin calc | `Cost_Price__c` found on PricebookEntry — may need OLI equivalent |
| `Contract_Type__c`                   | Picklist        | Contract Type      | Yes                 | **Needs verification** — e.g., "Software Subscription"            |
| `Subscription_Billing_Commitment__c` | Picklist/String | Billing Commitment | Yes                 | **Needs verification**                                            |
| `Subscription_Start_Date__c`         | Date            | Start Date         | Yes                 | **Needs verification**                                            |
| `Subscription_Term__c`               | Number          | Term (Months)      | Yes                 | **Needs verification**                                            |
| `Subscription_Billing_Plan__c`       | Picklist        | Billing Plan       | Conditional         | **Needs verification**                                            |

---

## 3. Account Fields (Read-Only in Portal)

| SF API Name                                   | Type    | Portal Use                                | Source                               |
| --------------------------------------------- | ------- | ----------------------------------------- | ------------------------------------ |
| `Id`                                          | ID      | Internal reference                        | Standard                             |
| `Name`                                        | String  | Display in search results                 | Standard                             |
| `Account_Number_aoc__c`                       | String  | Used in Opportunity naming convention     | `Opportunity_Naming_Convention` flow |
| `SCMC__Active__c`                             | Boolean | Check if active for SO creation           | `ION_CreateSalesOrder_PB_2`          |
| `SCMC__Customer__c`                           | Boolean | Check if customer flag set                | `ION_CreateSalesOrder_PB_2`          |
| `SCMC__E_Mail__c`                             | String  | Required for SO creation (fallback email) | `ION_CreateSalesOrder_PB_2`          |
| `RecordType.Name`                             | String  | Filter for "Supplier" vs Customer         | `SM_Account_Supplier_Site_PB`        |
| `BillingStreet/City/State/PostalCode/Country` | String  | Display / pre-fill                        | Standard                             |

---

## 4. Product2 Fields (Read-Only in Portal)

| SF API Name           | Type                | Portal Use                                   | Source                                                                    |
| --------------------- | ------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `Id`                  | ID                  | Link to PricebookEntry                       | Standard                                                                  |
| `Name`                | String              | Product selector display                     | Standard                                                                  |
| `IsActive`            | Boolean             | Filter: only active products                 | `FFX_SM_Product_Product_Group_PB`                                         |
| `Product_Sub_Type__c` | Picklist            | Filter: "Accessory", "Managed Service", etc. | `Opportunity_Add_Products`, `Opportunity_Parent_Child_Products_Generator` |
| `Line_of_Business__c` | Picklist            | Filter products by LOB                       | `Get_All_Accessories_New_Process`                                         |
| `Parent_Product__c`   | Reference(Product2) | Product hierarchy                            | `Get_Accessories_Related_to_Product`                                      |
| `Product_Category__c` | Reference           | Used in Tech Evaluation for H/W check        | `Technical_Evaluation`                                                    |

---

## 5. Portal → SF Write Mapping (Composite API Payload)

### 5.1 Opportunity Insert

```json
{
  "method": "PATCH",
  "url": "/services/data/v66.0/sobjects/Opportunity/Portal_Deal_Id__c/{portalDealId}",
  "body": {
    "AccountId": "001XXXXXXXXXXXXXXX",
    "StageName": "Qualification",
    "CloseDate": "2026-06-30",
    "Lines_Of_Business__c": "Software",
    "Funding_Type__c": "Subscription",
    "CurrencyIsoCode": "GBP",
    "Customer_Purchase_Order__c": "PO-12345",
    "Deliver_To__c": "003XXXXXXXXXXXXXXX",
    "IWM_Sales_Order_Req__c": true,
    "IWM_Sales_Order_Type__c": "Software"
  }
}
```

> **Note:** `Name` is omitted — the `Opportunity_Naming_Convention` flow generates it.

### 5.2 OpportunityLineItem Insert

```json
{
  "method": "PATCH",
  "url": "/services/data/v66.0/sobjects/OpportunityLineItem/Portal_Line_Id__c/{portalLineId}",
  "body": {
    "OpportunityId": "006XXXXXXXXXXXXXXX",
    "PricebookEntryId": "01uXXXXXXXXXXXXXXX",
    "Quantity": 10,
    "UnitPrice": 49.99,
    "Product_Condition__c": "New"
  }
}
```

---

## 6. External ID Strategy for Idempotent Upsert

| Object              | External ID Field   | Format  | Example                                |
| ------------------- | ------------------- | ------- | -------------------------------------- |
| Opportunity         | `Portal_Deal_Id__c` | UUID v4 | `3f2504e0-4f89-11d3-9a0c-0305e82c3301` |
| OpportunityLineItem | `Portal_Line_Id__c` | UUID v4 | `6ba7b810-9dad-11d1-80b4-00c04fd430c8` |

> ⚠️ **These external ID fields must be created on the Salesforce org** if they don't already exist.  
> Both must be: `Text(36)`, `Unique`, `External ID = true`, `Case Insensitive`.

---

## 7. Field Dependencies Discovered

| Dependency                                                     | Detail                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Lines_Of_Business__c` → `Name`                                | LOB value is appended to auto-generated Opportunity Name               |
| `Lines_Of_Business__c` → Owner assignment                      | `Set_Opportunity_Owner` flow routes owner based on LOB                 |
| `Lines_Of_Business__c` → Technical Evaluation routing          | Different approval paths for Digital Workspace, Cyber Security, etc.   |
| `Lines_Of_Business__c` → Product filtering                     | Accessories filtered by LOB in new product flows                       |
| `Funding_Type__c` → Commission calculation                     | Commission flows stamp Funding_Type on Commission_Payment\_\_c records |
| `StageName` = 'Closed Won' → SO creation                       | `ION_CreateSalesOrder_PB_2` fires only on Closed Won                   |
| `IWM_Sales_Order_Req__c` → SO creation                         | Must be true for Sales Order to be created                             |
| `Pricebook2Id` + `CurrencyIsoCode` → PricebookEntry resolution | Both must match when looking up PricebookEntry for OLI                 |
