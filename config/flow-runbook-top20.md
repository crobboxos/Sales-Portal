# Top 20 Active Flow Runbook (System Behavior)

Generated: 2026-03-02 14:12:19 UTC
Source org alias: xeretec-sandfull01
Selection method: highest integration/system impact score from active flow map.

Score factors: external touchpoint count, touchpoint count, trigger-object business criticality,
flow-name business keywords, and presence of entry criteria.

## Ranked List

- 1. `FFX_SM_Product_Product_Group_PB` (score 441, trigger `Product2` / `onAllChanges`)
- 2. `Vantage_Invoices` (score 334, trigger `` / ``)
- 3. `Compliance_Approval_Flow` (score 294, trigger `Opportunity` / ``)
- 4. `Reject_Opp` (score 284, trigger `Opportunity` / ``)
- 5. `SM_Account_Supplier_Site_PB` (score 236, trigger `Account` / `RecordAfterSave`)
- 6. `Demo_Run_Decision_Action` (score 221, trigger `` / ``)
- 7. `All_Companies_House_Check` (score 221, trigger `` / ``)
- 8. `Technical_Evaluation` (score 161, trigger `Opportunity` / ``)
- 9. `ION_CreateSalesOrder_PB` (score 151, trigger `Opportunity` / `onAllChanges`)
- 10. `Opportunity_Compliance_Calculation` (score 147, trigger `Opportunity` / `RecordAfterSave`)
- 11. `Call_Foundations_Billing_PB` (score 144, trigger `SCMC__Invoicing__c` / `onAllChanges`)
- 12. `ION_CreateSalesOrder_PB_2` (score 141, trigger `Opportunity` / `RecordAfterSave`)
- 13. `Agilyx_Purchase_Order_Trigger_to_Release_Payable_Invoice` (score 137, trigger `SCMC__Purchase_Order__c` / `RecordAfterSave`)
- 14. `Create_Commission_Opp_Split` (score 127, trigger `OpportunitySplit` / `RecordAfterSave`)
- 15. `Parent_MACD_Add` (score 124, trigger `` / ``)
- 16. `FFXSCM_Process_Invoice_Lines` (score 114, trigger `SCMC__Invoice_Line_Item__c` / ``)
- 17. `Agilyx_Payable_Invoice_on_Hold_Release` (score 114, trigger `c2g__codaPurchaseInvoice__c` / `RecordAfterSave`)
- 18. `UpdateCompanyTaxInformation` (score 111, trigger `fferpcore__CompanyTaxInformation__c` / `onCreateOnly`)
- 19. `Tax_Rate_Synchronisation` (score 111, trigger `c2g__codaTaxRate__c` / `onAllChanges`)
- 20. `Tax_Code` (score 111, trigger `c2g__codaTaxCode__c` / `onAllChanges`)

## 1. FFX_SM_Product_Product_Group_PB

- Run context: process `Workflow`, version `2`
- Trigger: `Product2` / `onAllChanges`
- Entry criteria: myVariable_current.IsActive EqualTo True; myVariable_current.c2g__CODAPurchaseAnalysisAccount__c IsNull False; myVariable_current.ION_Is_Stock_Item__c EqualTo True; myVariable_current.link_OPIProdGrp_Id__r.Id IsNull True
- In-system effect summary: Runs on Product2 (onAllChanges). Writes data to Product2. Invokes action calls for downstream processing.
- Data reads: None
- Data writes: creates[None] updates[Product2 (Set Tax Code (Blank)); Product2 (Update Tax Code)] deletes[None]
- Action calls: apex:fferpcore__MessagingActionDeliverNow (Create OPI Product Group) [publication=Create OPI Product Group - Product]; apex:fferpcore__MessagingActionDeliverNow (CreateItem) [publication=CreateItem - Product]; apex:fferpcore__MessagingActionDeliverNow (Update Product Group) [publication=Spend Product - Product]; apex:fferpcore__MessagingActionDeliverNow (Update Accounting Item) [publication=Spend Product (Accounting Item) - Product]
- Subflows: None
- External/API note: Potential external/API touchpoints detected (4): fferpcore__MessagingActionDeliverNow [publication=Create OPI Product Group - Product]; fferpcore__MessagingActionDeliverNow [publication=CreateItem - Product]; fferpcore__MessagingActionDeliverNow [publication=Spend Product - Product].
- Branch logic:
  - myDecision -> OPI Item?: (and) myVariable_current.IsActive EqualTo true | myVariable_current.c2g__CODAPurchaseAnalysisAccount__c IsNull false | myVariable_current.ION_Is_Stock_Item__c EqualTo true | myVariable_current.link_OPIProdGrp_Id__r.Id IsNull true
  - myDecision10 -> Tax Code Blank: (and) myVariable_current.FFX_InputTaxCodeERP__c IsNull true | myVariable_current.ION_Is_Spend__c EqualTo true
  - myDecision2 -> Product Is OPI Inventory: (and) myVariable_current.ION_Is_Stock_Item__c EqualTo true | myVariable_current.IsActive EqualTo true | myVariable_current.c2g__CODAPurchaseAnalysisAccount__c IsNull false
  - myDecision4 -> Spend Product?: (and) myVariable_current.IsActive EqualTo true | myVariable_current.c2g__CODAPurchaseAnalysisAccount__c IsNull false | myVariable_current.ION_Is_Stock_Item__c EqualTo false | myVariable_current.ION_Is_Spend__c EqualTo true

## 2. Vantage_Invoices

- Run context: process `AutoLaunchedFlow`, version `4`
- Trigger: `(not explicit)` / `(not explicit)`
- Entry criteria: Get_Vantage_Invoices IsNull False
- In-system effect summary: Runs on an internal event (an automation context). Performs record writes (object unresolved in metadata extract). Reads from Account, Vantage_Invoice__c. Invokes action calls for downstream processing.
- Data reads: Account (Get Account Details); Vantage_Invoice__c (Get Vantage Invoices)
- Data writes: creates[Create invoice lines; Create Invoices] updates[None] deletes[Delete Vantage invoices]
- Action calls: apex:VantageApiInvoiceLinesQuery (Invoice Lines); apex:CalloutHelper (Vantage Authorisation); apex:VantageApiInvoiceQuery (Vantage Invoices)
- Subflows: None
- External/API note: Potential external/API touchpoints detected (3): VantageApiInvoiceLinesQuery; CalloutHelper; VantageApiInvoiceQuery.
- Branch logic:
  - Check Invoices -> Invoices Exist: (and) Get_Vantage_Invoices IsNull false

## 3. Compliance_Approval_Flow

- Run context: process `AutoLaunchedFlow`, version `19`
- Trigger: `Opportunity` / `(not explicit)`
- Entry criteria: orderCreationInput EqualTo Create
- In-system effect summary: Runs on an internal event (an automation context). Writes data to ContentNote. Reads from MACD_Line_Item__c, MACD__c, Opportunity, ProcessInstance, ProcessInstanceWorkitem. Invokes action calls for downstream processing. Chains into subflows.
- Data reads: ProcessInstanceWorkitem (get approval); ProcessInstanceWorkitem (get approval with User); MACD_Line_Item__c (Get MACD Lines); MACD__c (Get MACDs); Opportunity (Get new opp details); ProcessInstance (Get Process Instance)
- Data writes: creates[Create Doc Link; Create Opportunity Approval Records; ContentNote (Create Rejection Note)] updates[Update MACD; Update MACD Lines; Update Order] deletes[None]
- Action calls: apex:ResolveApprovalRequest (Approve Opp); apex:ResolveApprovalRequest (Copy 1 of Approve Opp); customNotificationAction:customNotificationAction (Copy 1 of Copy 1 of Send Rejection notification); customNotificationAction:customNotificationAction (Copy 1 of Send Rejection notification); customNotificationAction:customNotificationAction (Send Rejection notification)
- Subflows: Check_for_Approved_Products
- External/API note: Potential external/API touchpoints detected (2): ResolveApprovalRequest; ResolveApprovalRequest; customNotificationAction.
- Branch logic:
  - Check for order creation -> Order Creation: (and) orderCreationInput EqualTo Create
  - Check if Rejection -> Rejection: (or) decision EqualTo Reject | $Permission.Compliance_Auto_Approval EqualTo true
  - Check Interaction -> Auto Interaction: (and) decision EqualTo Reject | interactionType EqualTo Auto || Not Auto Rejection: (and) decision EqualTo Reject || Approved Deal: (and) decision EqualTo Approve
  - Check Output of Approved Products -> Products not approved: (and) Check_for_Approved_Products.ApprovalStatus EqualTo true

## 4. Reject_Opp

- Run context: process `AutoLaunchedFlow`, version `2`
- Trigger: `Opportunity` / `(not explicit)`
- Entry criteria: decision EqualTo Reject
- In-system effect summary: Runs on an internal event (an automation context). Writes data to ContentNote. Reads from ProcessInstance, ProcessInstanceWorkitem. Invokes action calls for downstream processing.
- Data reads: ProcessInstanceWorkitem (get approval); ProcessInstanceWorkitem (get approval with User); ProcessInstance (Get Process Instance)
- Data writes: creates[Create Doc Link; ContentNote (Create Rejection Note)] updates[None] deletes[None]
- Action calls: apex:ResolveApprovalRequest (Approve Opp); apex:ResolveApprovalRequest (Copy 1 of Approve Opp); customNotificationAction:customNotificationAction (Copy 1 of Copy 1 of Send Rejection notification); customNotificationAction:customNotificationAction (Copy 1 of Send Rejection notification); customNotificationAction:customNotificationAction (Send Rejection notification)
- Subflows: None
- External/API note: Potential external/API touchpoints detected (2): ResolveApprovalRequest; ResolveApprovalRequest; customNotificationAction.
- Branch logic:
  - Check if Rejection -> Rejection: (and) decision EqualTo Reject
  - Check Interaction -> Auto Interaction: (and) decision EqualTo Reject | interactionType EqualTo Auto || Not Auto Rejection: (and) decision EqualTo Reject || Approved Deal: (and) decision EqualTo Approve

## 5. SM_Account_Supplier_Site_PB

- Run context: process `AutoLaunchedFlow`, version `4`
- Trigger: `Account` / `RecordAfterSave`
- Entry criteria: formula_TRUE_myRule_1 EqualTo True
- In-system effect summary: Runs on Account (RecordAfterSave). Performs record writes (object unresolved in metadata extract). Invokes action calls for downstream processing.
- Data reads: None
- Data writes: creates[None] updates[Update Input Tax Code (Foundations); Remove Input Tax Code (Foundations); Update Vendor Contact; Update Finance Contact] deletes[None]
- Action calls: apex:fferpcore__MessagingActionDeliverNow (Update Supplier Site) [publication=Supplier Account - Account]; apex:fferpcore__MessagingActionDeliverNow (Update Vendor Contact) [publication=Supplier Contact - Account]
- Subflows: None
- External/API note: Potential external/API touchpoints detected (2): fferpcore__MessagingActionDeliverNow [publication=Supplier Account - Account]; fferpcore__MessagingActionDeliverNow [publication=Supplier Contact - Account].
- Branch logic:
  - Update Tax Code (Foundations) -> TRUE_Update Tax Code (Foundations): (and) formula_TRUE_myRule_1 EqualTo true
  - Remove Tax Code (Foundations) -> TRUE_Remove Tax Code (Foundations): (and) formula_TRUE_myRule_3 EqualTo true
  - Update Vendor Contact -> TRUE_Update Vendor Contact: (and) $Record.FFX_SMCisFinanceContact__c EqualTo true | $Record.c2g__CODAFinanceContact__c IsNull false
  - Is Vendor? -> TRUE_Is Vendor?: (and) $Record.c2g__CODAAccountsPayableControl__c IsNull false | $Record.SCMC__Active__c EqualTo true | $Record.RecordType.Name EqualTo Supplier

## 6. Demo_Run_Decision_Action

- Run context: process `Flow`, version `2`
- Trigger: `(not explicit)` / `(not explicit)`
- Entry criteria: Loop_over_trees.treeId EqualTo Default_decision_tree
- In-system effect summary: Runs on an internal event (an automation context). Does not show direct record-write elements.
- Data reads: None
- Data writes: creates[None] updates[None] deletes[None]
- Action calls: Action:apex:CS_APP__InvocableGetDecisionTreesService (CS_APP__InvocableGetDecisionTreesService [Get All Decision Trees]); Action:apex:CS_APP__InvocableDecisionActionService (CS_APP__InvocableDecisionActionService [Run Decision Action Action 1])
- Subflows: None
- External/API note: Potential external/API touchpoints detected (2): Action:apex:CS_APP__InvocableGetDecisionTreesService; Action:apex:CS_APP__InvocableDecisionActionService.
- Branch logic: no explicit decision nodes detected.

## 7. All_Companies_House_Check

- Run context: process `Flow`, version `3`
- Trigger: `(not explicit)` / `(not explicit)`
- Entry criteria: AccountName NotEqualTo; BillingCity NotEqualTo; BillingCountry NotEqualTo; BillingPostalCode NotEqualTo
- In-system effect summary: Runs on an internal event (an automation context). Performs record writes (object unresolved in metadata extract). Reads from Account, comp_house__CompanyHouse__c. Invokes action calls for downstream processing.
- Data reads: comp_house__CompanyHouse__c (Check API Custom Setting); Account (Retrieve Account Details)
- Data writes: creates[None] updates[Update Account; Update Account] deletes[None]
- Action calls: apex:comp_house__CompanyHouse_CompanyProfile (Company House Profile Search); apex:comp_house__CompanyHouse_CompanySearch (Company Search Results)
- Subflows: None
- External/API note: Potential external/API touchpoints detected (2): comp_house__CompanyHouse_CompanyProfile; comp_house__CompanyHouse_CompanySearch.
- Branch logic:
  - Anything to Update? -> Yes: (or) AccountName NotEqualTo | BillingCity NotEqualTo | BillingCountry NotEqualTo | BillingPostalCode NotEqualTo
  - API Key Present -> Yes: (and) CustomSetting.comp_house__API_Key__c NotEqualTo
  - Was a result selected? -> Yes, a result was selected: (and) SelectedCompanyId NotEqualTo

## 8. Technical_Evaluation

- Run context: process `Flow`, version `11`
- Trigger: `Opportunity` / `(not explicit)`
- Entry criteria: decision EqualTo Approve
- In-system effect summary: Runs on an internal event (an automation context). Writes data to ContentNote. Reads from Opportunity, OpportunityLineItem, ProcessInstance, ProcessInstanceWorkitem. Invokes action calls for downstream processing. Chains into subflows.
- Data reads: ProcessInstanceWorkitem (Get Appoval); Opportunity (Get Opportunity); Opportunity (Get Other Opps); ProcessInstance (Get Process Instance); OpportunityLineItem (Get Products)
- Data writes: creates[ContentNote (Copy 1 of Create Note); Copy 1 of Create Note Link; ContentNote (Create Note); Create Note Link] updates[Update Opp; Update Opp Approver; Update Opp For Tech Status] deletes[None]
- Action calls: apex:ResolveApprovalRequest (Recall Approval Action); submit:submit (Submit for Technical Approval)
- Subflows: Reject_Opp
- External/API note: Potential external/API touchpoints detected (1): ResolveApprovalRequest; submit.
- Branch logic:
  - Check Approval -> Approved: (and) decision EqualTo Approve
  - Check Approver -> Approvel Empty: (and) Get_Opportunity.Technical_Approver__c IsNull true
  - Check for H/W -> H/W found: (and) Check_Products.Product2.Product_Category__r.Name Contains H/W
  - Check for Other Categories -> Category contains Other: (and) Software_Categories Contains Other

## 9. ION_CreateSalesOrder_PB

- Run context: process `Workflow`, version `1`
- Trigger: `Opportunity` / `onAllChanges`
- Entry criteria: myVariable_old IsNull False; myVariable_old.IWM_Sales_Order_Type__c NotEqualTo myVariable_current.IWM_Sales_Order_Type__c
- In-system effect summary: Runs on Opportunity (onAllChanges). Does not show direct record-write elements. Invokes action calls for downstream processing.
- Data reads: None
- Data writes: creates[None] updates[None] deletes[None]
- Action calls: flow:ION_UpdateOppWithSORecType (UpdateOppWithSORecType); apex:fferpcore__MessagingActionDeliverNow (CreateSO) [publication=CreateSOPub - Opportunity]
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): ION_UpdateOppWithSORecType; fferpcore__MessagingActionDeliverNow [publication=CreateSOPub - Opportunity].
- Branch logic:
  - isChangedDecision2_myRule_1_IWM_Sales_Order_Type_c -> isChangedRule_2_myRule_1_IWM_Sales_Order_Type_c: (and) myVariable_old IsNull false | myVariable_old.IWM_Sales_Order_Type__c NotEqualTo myVariable_current.IWM_Sales_Order_Type__c
  - myDecision -> SO RecordType chosen: (and) myVariable_current.IWM_Sales_Order_Type__c IsNull false | isChangedRule_2_myRule_1_IWM_Sales_Order_Type_c EqualTo true
  - myDecision3 -> Closed Won: (and) myVariable_current.StageName EqualTo Closed Won | myVariable_current.IWM_Sales_Order_Req__c EqualTo true | myVariable_current.link_Opp2SO_State__c NotEqualTo Ok

## 10. Opportunity_Compliance_Calculation

- Run context: process `AutoLaunchedFlow`, version `5`
- Trigger: `Opportunity` / `RecordAfterSave`
- Entry criteria: (and) Approval_Status__c EqualTo Approved
- In-system effect summary: Runs on Opportunity (RecordAfterSave). Performs record writes (object unresolved in metadata extract). Reads from BusinessHours, ProcessInstance. Invokes action calls for downstream processing.
- Data reads: BusinessHours (Get Business Hours); ProcessInstance (Get Process Instances)
- Data writes: creates[None] updates[Update Time til compliant] deletes[None]
- Action calls: apex:BusinessHoursCalculator (Calculate Business Hours)
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): BusinessHoursCalculator.
- Branch logic: no explicit decision nodes detected.

## 11. Call_Foundations_Billing_PB

- Run context: process `Workflow`, version `1`
- Trigger: `SCMC__Invoicing__c` / `onAllChanges`
- Entry criteria: myVariable_old IsNull False; myVariable_old.ION_Bill_To_FFA__c NotEqualTo myVariable_current.ION_Bill_To_FFA__c
- In-system effect summary: Runs on SCMC__Invoicing__c (onAllChanges). Does not show direct record-write elements. Invokes action calls for downstream processing.
- Data reads: None
- Data writes: creates[None] updates[None] deletes[None]
- Action calls: apex:fferpcore__MessagingActionDeliverNow (Bill to FFA) [publication=CreateSINPub - Invoicing]
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): fferpcore__MessagingActionDeliverNow [publication=CreateSINPub - Invoicing].
- Branch logic:
  - isChangedDecision2_myRule_1_ION_Bill_To_FFA_c -> isChangedRule_2_myRule_1_ION_Bill_To_FFA_c: (and) myVariable_old IsNull false | myVariable_old.ION_Bill_To_FFA__c NotEqualTo myVariable_current.ION_Bill_To_FFA__c
  - myDecision -> Invoice to Bill flag set: (and) myVariable_current.ION_Bill_To_FFA__c EqualTo true | isChangedRule_2_myRule_1_ION_Bill_To_FFA_c EqualTo true | myVariable_current.SCMC__Status__c EqualTo Closed

## 12. ION_CreateSalesOrder_PB_2

- Run context: process `AutoLaunchedFlow`, version `5`
- Trigger: `Opportunity` / `RecordAfterSave`
- Entry criteria: (and) StageName EqualTo Closed Won; IWM_Sales_Order_Req__c EqualTo true; link_Opp2SO_State__c NotEqualTo Ok
- In-system effect summary: Runs on Opportunity (RecordAfterSave). Performs record writes (object unresolved in metadata extract). Reads from Account. Invokes action calls for downstream processing.
- Data reads: Account (Check customer account)
- Data writes: creates[None] updates[Activate Account] deletes[None]
- Action calls: apex:fferpcore__MessagingActionDeliverNow (CreateSO) [publication=CreateSOPub - Opportunity]
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): fferpcore__MessagingActionDeliverNow [publication=CreateSOPub - Opportunity].
- Branch logic:
  - Check if customer active -> Customer not active: (or) Check_customer_account.SCMC__Active__c NotEqualTo true | Check_customer_account.SCMC__Customer__c NotEqualTo true | Check_customer_account.SCMC__E_Mail__c IsNull true
  - Copy 1 of Check if customer active -> Copy 1 of Customer not active: (or) Check_customer_account.SCMC__Active__c NotEqualTo true | Check_customer_account.SCMC__Customer__c NotEqualTo true | Check_customer_account.SCMC__E_Mail__c IsNull true

## 13. Agilyx_Purchase_Order_Trigger_to_Release_Payable_Invoice

- Run context: process `AutoLaunchedFlow`, version `1`
- Trigger: `SCMC__Purchase_Order__c` / `RecordAfterSave`
- Entry criteria: (and) SCMC__Status__c EqualTo Closed
- In-system effect summary: Runs on SCMC__Purchase_Order__c (RecordAfterSave). Writes data to c2g__codaPurchaseInvoice__c. Reads from SCMC__AP_Voucher__c. Invokes action calls for downstream processing.
- Data reads: SCMC__AP_Voucher__c (Get AP Vouchers)
- Data writes: creates[None] updates[c2g__codaPurchaseInvoice__c (Uncheck Payable Invoice Partial PO with Full Invoice)] deletes[None]
- Action calls: apex:AgxPayableInvoiceRelease (Payable Invoice Release)
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): AgxPayableInvoiceRelease.
- Branch logic:
  - AP Voucher records is null? -> No: (and) Get_AP_Vouchers IsNull false
  - Payable Invoice on Hold? -> On Hold: (and) AP_Vouchers_for_Payable_Invoice_IDs.SCMFFA__Payable_Invoice__r.c2g__HoldStatus__c EqualTo On Hold | AP_Vouchers_for_Payable_Invoice_IDs.SCMFFA__Payable_Invoice__r.Agx_Partial_PO_with_Full_Invoice__c EqualTo true

## 14. Create_Commission_Opp_Split

- Run context: process `AutoLaunchedFlow`, version `6`
- Trigger: `OpportunitySplit` / `RecordAfterSave`
- Entry criteria: $Record.Opportunity.CloseDate LessThanOrEqualTo 2023-02-28; $Record.SplitOwner.LastName EqualTo Sangster
- In-system effect summary: Runs on OpportunitySplit (RecordAfterSave). Does not show direct record-write elements. Reads from Commission_Payment_Plans__c, OpportunityLineItem. Invokes action calls for downstream processing. Chains into subflows.
- Data reads: Commission_Payment_Plans__c (Get Payment Plans); OpportunityLineItem (Get Products)
- Data writes: creates[None] updates[None] deletes[None]
- Action calls: apex:GenericObjectOperationBatchLauncher (Create Commission)
- Subflows: Commission_Assign_Plan
- External/API note: Potential external/API touchpoints detected (1): GenericObjectOperationBatchLauncher.
- Branch logic:
  - Check Date -> < 28/02: (or) $Record.Opportunity.CloseDate LessThanOrEqualTo 2023-02-28 | $Record.SplitOwner.LastName EqualTo Sangster
  - Check Dicision for Currency -> Irish: (and) $Record.Department__c EqualTo Ireland

## 15. Parent_MACD_Add

- Run context: process `Flow`, version `6`
- Trigger: `(not explicit)` / `(not explicit)`
- Entry criteria: Add_Accessories EqualTo Yes
- In-system effect summary: Runs on an internal event (an automation context). Writes data to ContentDocumentLink, ContentNote, OpportunityLineItem. Reads from Location, Opportunity, OpportunityLineItem, PricebookEntry, Product2, Product_Groups__c. Invokes action calls for downstream processing. Chains into subflows.
- Data reads: Product_Groups__c (Get Accessories); Location (Get Locations); Product_Groups__c (Get Managed Services); Opportunity (Get Opportunit); OpportunityLineItem (Get Opportunity Groups); Product2 (Get Parent Product)
- Data writes: creates[ContentDocumentLink (Create Document Link); OpportunityLineItem (Create GP Line); ContentNote (Create Note); Create Parent Products; OpportunityLineItem (Create Rebate Line); OpportunityLineItem (Create Refinance Line)] updates[None] deletes[None]
- Action calls: apex:GenericObjectOperationBatchLauncher (Create Child Opp Lines)
- Subflows: Create_Install_Analyst_Line
- External/API note: Potential external/API touchpoints detected (1): GenericObjectOperationBatchLauncher.
- Branch logic:
  - Check Accessory Decision -> Accessory Same Config: (and) Add_Accessories EqualTo Yes
  - Check for Managed Services -> Managed Services Exist: (and) Get_Managed_Services IsNull false
  - Check for Print -> Print LOB: (and) Get_Opportunit.Lines_Of_Business__c EqualTo Print
  - Check for valid location -> Location Exists: (and) Filter_Locations IsEmpty false

## 16. FFXSCM_Process_Invoice_Lines

- Run context: process `AutoLaunchedFlow`, version `4`
- Trigger: `SCMC__Invoice_Line_Item__c` / `(not explicit)`
- Entry criteria: varFirst EqualTo True
- In-system effect summary: Runs on an internal event (an automation context). Performs record writes (object unresolved in metadata extract). Reads from SCMC__Inventory_Transaction_Financial_Records__c, SCMC__Inventory_Transaction_Perpetual_Record__c. Invokes action calls for downstream processing.
- Data reads: SCMC__Inventory_Transaction_Financial_Records__c (Inv Financial); SCMC__Inventory_Transaction_Perpetual_Record__c (Inv Transaction)
- Data writes: creates[reverse Bill] updates[UpdTransactions] deletes[None]
- Action calls: apex:GenericObjectOperationBatchLauncher (Create Inv Trans Fin)
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): GenericObjectOperationBatchLauncher.
- Branch logic:
  - First -> Yes: (and) varFirst EqualTo true
  - Transactions found -> yes: (and) Inv_Transaction IsNull false

## 17. Agilyx_Payable_Invoice_on_Hold_Release

- Run context: process `AutoLaunchedFlow`, version `1`
- Trigger: `c2g__codaPurchaseInvoice__c` / `RecordAfterSave`
- Entry criteria: (and) SCMFFA__AP_Voucher__c IsNull false; c2g__InvoiceStatus__c EqualTo Complete; Agx_Partial_PO_with_Full_Invoice__c EqualTo true
- In-system effect summary: Runs on c2g__codaPurchaseInvoice__c (RecordAfterSave). Does not show direct record-write elements. Invokes action calls for downstream processing.
- Data reads: None
- Data writes: creates[None] updates[None] deletes[None]
- Action calls: apex:AgxPayableInvoiceHold (Place Payable Invoice on Hold)
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): AgxPayableInvoiceHold.
- Branch logic:
  - Is PO Fully Receipted? -> Yes: (and) $Record.SCMFFA__AP_Voucher__r.SCMC__Purchase_Order__r.SCMC__Status__c EqualTo Closed

## 18. UpdateCompanyTaxInformation

- Run context: process `Workflow`, version `1`
- Trigger: `fferpcore__CompanyTaxInformation__c` / `onCreateOnly`
- Entry criteria: formula_myRule_1 EqualTo True
- In-system effect summary: Runs on fferpcore__CompanyTaxInformation__c (onCreateOnly). Does not show direct record-write elements. Invokes action calls for downstream processing.
- Data reads: None
- Data writes: creates[None] updates[None] deletes[None]
- Action calls: apex:fferpcore__MessagingActionDeliverNow (ERP Integration) [publication=Update - Company Tax Information]
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): fferpcore__MessagingActionDeliverNow [publication=Update - Company Tax Information].
- Branch logic:
  - myDecision -> Add Lookup: (and) formula_myRule_1 EqualTo true

## 19. Tax_Rate_Synchronisation

- Run context: process `Workflow`, version `1`
- Trigger: `c2g__codaTaxRate__c` / `onAllChanges`
- Entry criteria: formula_myRule_1 EqualTo True
- In-system effect summary: Runs on c2g__codaTaxRate__c (onAllChanges). Does not show direct record-write elements. Invokes action calls for downstream processing.
- Data reads: None
- Data writes: creates[None] updates[None] deletes[None]
- Action calls: apex:fferpcore__MessagingActionDeliverNow (ERP Synch) [publication=FFA/TaxCode - Tax Code]
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): fferpcore__MessagingActionDeliverNow [publication=FFA/TaxCode - Tax Code].
- Branch logic:
  - myDecision -> ERP Synch: (and) formula_myRule_1 EqualTo true

## 20. Tax_Code

- Run context: process `Workflow`, version `1`
- Trigger: `c2g__codaTaxCode__c` / `onAllChanges`
- Entry criteria: formula_myRule_1 EqualTo True
- In-system effect summary: Runs on c2g__codaTaxCode__c (onAllChanges). Does not show direct record-write elements. Invokes action calls for downstream processing.
- Data reads: None
- Data writes: creates[None] updates[None] deletes[None]
- Action calls: apex:fferpcore__MessagingActionDeliverNow (ERP Sych) [publication=FFA/TaxCode - Tax Code]
- Subflows: None
- External/API note: Potential external/API touchpoints detected (1): fferpcore__MessagingActionDeliverNow [publication=FFA/TaxCode - Tax Code].
- Branch logic:
  - myDecision -> ERP Synch: (and) formula_myRule_1 EqualTo true
