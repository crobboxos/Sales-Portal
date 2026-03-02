# Flow API Touchpoint Overview

Snapshot generated from org alias `xeretec-sandfull01` on `2026-03-02`.

## What was mapped

- Active flow versions analyzed: `235`
- Active flow XML files retrieved: `231` into `config/flow-metadata-active/flows/`
- Flows with any touchpoint element: `69`
- Flows with external integration candidate touchpoints: `25`
- Total touchpoint rows found: `131`
- External-candidate touchpoint rows: `35`

Note: "external candidate" is a heuristic classification based on Apex action usage and integration-style keywords (`api`, `callout`, `messaging`, `publish`, etc.). Validate each candidate with business owners.

## Key outputs

- `config/flow-active-map.csv`  
  One row per active flow with trigger object/type, entry criteria summary, and touchpoint counts.
- `config/flow-active-touchpoints.csv`  
  One row per touchpoint discovered from Flow metadata.
- `config/flow-active-external-touchpoints.csv`  
  Touchpoints flagged as likely integration-facing.
- `config/flow-active-external-flow-summary.csv`  
  Active flows with at least one external-candidate touchpoint.
- `config/flow-active-package.xml`  
  Manifest generated from active flow names.
- `config/flow-metadata-active/flows/*.flow-meta.xml`  
  Retrieved Flow XML metadata files for deep inspection.

## Top candidate flows by external touchpoints

1. `FFX_SM_Product_Product_Group_PB` (4/4 touchpoints external-candidate)
2. `Vantage_Invoices` (3/3)
3. `All_Companies_House_Check` (2/2)
4. `Compliance_Approval_Flow` (2/6)
5. `Demo_Run_Decision_Action` (2/2)
6. `Reject_Opp` (2/5)
7. `SM_Account_Supplier_Site_PB` (2/2)

## Examples of detected touchpoints

- `Agilyx_Payable_Invoice_on_Hold_Release` -> `Action:apex` -> `AgxPayableInvoiceHold`
- `All_Companies_House_Check` -> `Action:apex` -> `comp_house__CompanyHouse_CompanyProfile`
- `Call_Foundations_Billing_PB` -> `Action:apex` -> `fferpcore__MessagingActionDeliverNow`
- `Demo_Run_Decision_Action` -> `Action:apex` -> `CS_APP__InvocableDecisionActionService`
- `FFXSCM_Process_Invoice_Lines` -> `Action:apex` -> `GenericObjectOperationBatchLauncher`

## Retrieval warnings

Metadata retrieval returned 4 not-found flow names in the generated package:

- `Start_Authentication`
- `End_Authentication`
- `Demo_Run_Decision_Action`
- `Companies_House_Flow`

All other active flows were retrieved successfully.
