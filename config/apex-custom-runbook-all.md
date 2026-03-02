# Apex Runbook (Custom Namespace - All Artifacts)

Generated: 2026-03-02 14:27:22 UTC
Scope: `NamespacePrefix = null` (customer-owned Apex only).

## Ranked Inventory

- 1. `Class CalloutHelper` (score 151, touchpoints 2)
- 2. `Class VantageApiInvoiceQuery` (score 121, touchpoints 2)
- 3. `Class VantageApiInvoiceLinesQuery` (score 121, touchpoints 2)
- 4. `Trigger OppSyncTrigger` (score 111, touchpoints 1)
- 5. `Trigger OppLineSyncTrigger` (score 107, touchpoints 1)
- 6. `Class TPSChecker` (score 100, touchpoints 2)
- 7. `Class TPSCallout` (score 100, touchpoints 2)
- 8. `Trigger dlrs_OpportunityTrigger` (score 99, touchpoints 0)
- 9. `Class PortalCertiniaReceiptApi` (score 98, touchpoints 1)
- 10. `Class HP_API_AccountService` (score 98, touchpoints 2)
- 11. `Class HPAuthService` (score 92, touchpoints 1)
- 12. `Trigger dlrs_OpportunityLineItemTrigger` (score 89, touchpoints 0)
- 13. `Trigger dlrs_AccountTrigger` (score 84, touchpoints 0)
- 14. `Trigger QuoteLineSyncTrigger` (score 84, touchpoints 1)
- 15. `Trigger QuoteSyncTrigger` (score 74, touchpoints 1)
- 16. `Trigger dlrs_c2godaInvoiceTrigger` (score 64, touchpoints 0)
- 17. `Trigger dlrs_AssetTrigger` (score 64, touchpoints 0)
- 18. `Class GenericObjectOperationBatchLauncher` (score 57, touchpoints 2)
- 19. `Class ProductMergeService` (score 46, touchpoints 0)
- 20. `Trigger DisableFeedPostDeletes` (score 40, touchpoints 1)
- 21. `Trigger DisableFeedCommentDeletes` (score 40, touchpoints 1)
- 22. `Class ResolveApprovalRequest` (score 35, touchpoints 1)
- 23. `Class AgxPayableInvoiceRelease` (score 35, touchpoints 1)
- 24. `Class AgxPayableInvoiceHold` (score 35, touchpoints 1)
- 25. `Class GenericObjectOperationBatch` (score 34, touchpoints 1)
- 26. `Class DiscardInvoices` (score 33, touchpoints 1)
- 27. `Class BusinessHoursCalculator` (score 33, touchpoints 1)
- 28. `Class TPSCalloutTest` (score 30, touchpoints 2)
- 29. `Class AccountAssetDisposalController` (score 30, touchpoints 0)
- 30. `Class AssetDisposalWizardController` (score 24, touchpoints 0)
- 31. `Class TPSCheckerScheduler` (score 16, touchpoints 2)
- 32. `Class AutomaticCashMatching` (score 12, touchpoints 0)
- 33. `Class QuoteSyncTestSuite` (score 10, touchpoints 0)
- 34. `Class QuickLightningLookupController` (score 8, touchpoints 0)
- 35. `Class ShowProductsController` (score 4, touchpoints 0)
- 36. `Class ShowAssets` (score 4, touchpoints 0)
- 37. `Class ShowAccessoriesManagedServices2Assign` (score 4, touchpoints 0)
- 38. `Class ShippingLabelController` (score 4, touchpoints 0)
- 39. `Class MassDeleteExtension` (score 4, touchpoints 0)
- 40. `Class AccountUpdater` (score 4, touchpoints 0)
- 41. `Class xerTransController` (score 2, touchpoints 0)
- 42. `Class agxBankHoliday` (score 2, touchpoints 0)
- 43. `Class DisableChatterDeleteDelegate` (score 2, touchpoints 0)
- 44. `Class CommissionPaymentController` (score 2, touchpoints 0)
- 45. `Class xerTransControllerTest` (score 0, touchpoints 0)
- 46. `Class dlrs_c2godaInvoiceTest` (score 0, touchpoints 0)
- 47. `Class dlrs_OpportunityTest` (score 0, touchpoints 0)
- 48. `Class dlrs_OpportunityLineItemTest` (score 0, touchpoints 0)
- 49. `Class dlrs_AssetTest` (score 0, touchpoints 0)
- 50. `Class dlrs_AccountTest` (score 0, touchpoints 0)
- 51. `Class agxBankHolidayTest` (score 0, touchpoints 0)
- 52. `Class VantageApiInvoiceQueryTest` (score 0, touchpoints 0)
- 53. `Class VantageApiInvoiceLinesQueryTest` (score 0, touchpoints 0)
- 54. `Class TriggerStopper` (score 0, touchpoints 0)
- 55. `Class TestShippingLabelController` (score 0, touchpoints 0)
- 56. `Class TestAgxPayableInvoiceRelease` (score 0, touchpoints 0)
- 57. `Class TPSCheckerTest` (score 0, touchpoints 1)
- 58. `Class TPSCheckerSchedulerTest` (score 0, touchpoints 1)
- 59. `Class ShowProductsControllerTest` (score 0, touchpoints 0)
- 60. `Class ShowAssetsTest` (score 0, touchpoints 0)
- 61. `Class ResolveApprovalRequestsTest` (score 0, touchpoints 0)
- 62. `Class QuoteSyncUtil` (score 0, touchpoints 0)
- 63. `Class QuickLightningLookupControllerTest` (score 0, touchpoints 0)
- 64. `Class MassDeleteExtensionTest` (score 0, touchpoints 0)
- 65. `Class GenericObjectOperationBatchTest` (score 0, touchpoints 1)
- 66. `Class DiscardInvoicesTest` (score 0, touchpoints 0)
- 67. `Class DisableChatterDeletesTestSuite` (score 0, touchpoints 0)
- 68. `Class ConductorFromListViewControllerTest` (score 0, touchpoints 0)
- 69. `Class ConductorFromListViewController` (score 0, touchpoints 0)
- 70. `Class CommissionPaymentControllerTest` (score 0, touchpoints 0)
- 71. `Class CalloutHelperTest` (score 0, touchpoints 0)
- 72. `Class BusinessHoursCalculatorTest` (score 0, touchpoints 0)
- 73. `Class AgxPayableInvoiceHoldTest2` (score 0, touchpoints 0)

## Artifact Details

## 1. Class CalloutHelper

- Score: 151
- Class profile: callout `Y`, rest `N`, invocable `Y`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: CalloutHelper: Flow invocable, HTTP/callout logic
- Source: `config\apex-metadata-custom\classes\CalloutHelper.cls`
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)
  - HttpCalloutLogic: HTTP/callout-related code detected (external_candidate=Y)

## 2. Class VantageApiInvoiceQuery

- Score: 121
- Class profile: callout `Y`, rest `N`, invocable `Y`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: VantageApiInvoiceQuery: Flow invocable, HTTP/callout logic
- Source: `config\apex-metadata-custom\classes\VantageApiInvoiceQuery.cls`
- Custom object references: Vantage_Invoice__c;Id__c;Reference__c;InvoiceDate__c;DueDate__c;BaseNetValue__c;BaseTotalValue__c;Account__c;Type__c;SubType__c
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)
  - HttpCalloutLogic: HTTP/callout-related code detected (external_candidate=Y)

## 3. Class VantageApiInvoiceLinesQuery

- Score: 121
- Class profile: callout `Y`, rest `N`, invocable `Y`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: VantageApiInvoiceLinesQuery: Flow invocable, HTTP/callout logic
- Source: `config\apex-metadata-custom\classes\VantageApiInvoiceLinesQuery.cls`
- Custom object references: Vantage_Invoice_Line__c;Owner_Serial_Number__c;Invoice_Id__c;Meter_Start_Date__c;Meter_End_Date__c;Meter_Class_Name__c;Owner_Part_Number__c;Owner_Description__c;Owner_Location__c;Type__c;Details__c;Is_Price_Increase__c;Price_Increase__c;Contract_Id__c;Contract_Reference__c;Install_Date__c;Period_Review_Date__c;Net_Charge__c;VAT_Charge__c;Total_Charge__c;Inclusive_Colour_Count__c;Colour_Readings__c;Colour_Previous__c;Colour_Charge__c;Inclusive_Mono_Count__c;Mono_Readings__c;Mono_Previous__c;Mono_Charge__c;Inclusive_Large_Colour_Count__c;Large_Colour_Readings__c
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)
  - HttpCalloutLogic: HTTP/callout-related code detected (external_candidate=Y)

## 4. Trigger OppSyncTrigger

- Score: 111
- Trigger context: `Opportunity` / `after update`
- Query/DML indicators: SOQL `4`, DML keywords `5`
- Summary: Trigger on Opportunity (after update)
- Source: `config\apex-metadata-custom\triggers\OppSyncTrigger.trigger`
- Handler references: QuoteSyncUtil;TriggerStopper
- Touchpoints:
  - TriggerHandler: QuoteSyncUtil;TriggerStopper (external_candidate=N)

## 5. Trigger OppLineSyncTrigger

- Score: 107
- Trigger context: `OpportunityLineItem` / `before insert,after insert,after update`
- Query/DML indicators: SOQL `3`, DML keywords `9`
- Summary: Trigger on OpportunityLineItem (before insert,after insert,after update)
- Source: `config\apex-metadata-custom\triggers\OppLineSyncTrigger.trigger`
- Handler references: QuoteSyncUtil;TriggerStopper
- Touchpoints:
  - TriggerHandler: QuoteSyncUtil;TriggerStopper (external_candidate=N)

## 6. Class TPSChecker

- Score: 100
- Class profile: callout `Y`, rest `N`, invocable `N`, async `Database.Batchable`
- Query/DML indicators: SOQL `1`, DML keywords `1`
- Summary: TPSChecker: HTTP/callout logic, async=Database.Batchable
- Source: `config\apex-metadata-custom\classes\TPSChecker.cls`
- Custom object references: Next_TPS_Check__c;Last_TPS_Checked__c;PhoneDNU__c
- Touchpoints:
  - HttpCalloutLogic: HTTP/callout-related code detected (external_candidate=Y)
  - AsyncPattern: Database.Batchable (external_candidate=N)

## 7. Class TPSCallout

- Score: 100
- Class profile: callout `Y`, rest `N`, invocable `N`, async `Database.Batchable`
- Query/DML indicators: SOQL `1`, DML keywords `1`
- Summary: TPSCallout: HTTP/callout logic, async=Database.Batchable
- Source: `config\apex-metadata-custom\classes\TPSCallout.cls`
- Custom object references: TPS_Next_Check__c;TPS_Last_Checked__c;PhoneDNU__c;MobileDNU__c
- Touchpoints:
  - HttpCalloutLogic: HTTP/callout-related code detected (external_candidate=Y)
  - AsyncPattern: Database.Batchable (external_candidate=N)

## 8. Trigger dlrs_OpportunityTrigger

- Score: 99
- Trigger context: `Opportunity` / `before delete,before insert,before update,after delete,after insert,after undelete,after update`
- Query/DML indicators: SOQL `0`, DML keywords `7`
- Summary: Trigger on Opportunity (before delete,before insert,before update,after delete,after insert,after undelete,after update)
- Source: `config\apex-metadata-custom\triggers\dlrs_OpportunityTrigger.trigger`
- Touchpoints: none detected.

## 9. Class PortalCertiniaReceiptApi

- Score: 98
- Class profile: callout `N`, rest `Y`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: PortalCertiniaReceiptApi: REST endpoint
- Source: `config\apex-metadata-custom\classes\PortalCertiniaReceiptApi.cls`
- Touchpoints:
  - InboundREST: /portal/certinia/receipt-po (external_candidate=Y)

## 10. Class HP_API_AccountService

- Score: 98
- Class profile: callout `Y`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: HP_API_AccountService: HTTP/callout logic
- Source: `config\apex-metadata-custom\classes\HP_API_AccountService.cls`
- Custom object references: HP_Configer__c;Access_Token__c
- Touchpoints:
  - HttpCalloutLogic: HTTP/callout-related code detected (external_candidate=Y)
  - HttpCalloutEndpoint: https://hp-bss.eu.interworks.cloud/api/accounts?pageIndex=1&pageSize=500 (external_candidate=Y)

## 11. Class HPAuthService

- Score: 92
- Class profile: callout `Y`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `1`
- Summary: HPAuthService: HTTP/callout logic
- Source: `config\apex-metadata-custom\classes\HPAuthService.cls`
- Custom object references: HP_Configer__c;Access_Token__c;Token_Expiry__c
- Touchpoints:
  - HttpCalloutLogic: HTTP/callout-related code detected (external_candidate=Y)

## 12. Trigger dlrs_OpportunityLineItemTrigger

- Score: 89
- Trigger context: `OpportunityLineItem` / `before delete,before insert,before update,after delete,after insert,after undelete,after update`
- Query/DML indicators: SOQL `0`, DML keywords `7`
- Summary: Trigger on OpportunityLineItem (before delete,before insert,before update,after delete,after insert,after undelete,after update)
- Source: `config\apex-metadata-custom\triggers\dlrs_OpportunityLineItemTrigger.trigger`
- Touchpoints: none detected.

## 13. Trigger dlrs_AccountTrigger

- Score: 84
- Trigger context: `Account` / `before delete,before insert,before update,after delete,after insert,after undelete,after update`
- Query/DML indicators: SOQL `0`, DML keywords `7`
- Summary: Trigger on Account (before delete,before insert,before update,after delete,after insert,after undelete,after update)
- Source: `config\apex-metadata-custom\triggers\dlrs_AccountTrigger.trigger`
- Touchpoints: none detected.

## 14. Trigger QuoteLineSyncTrigger

- Score: 84
- Trigger context: `QuoteLineItem` / `before insert,after insert,after update`
- Query/DML indicators: SOQL `3`, DML keywords `10`
- Summary: Trigger on QuoteLineItem (before insert,after insert,after update)
- Source: `config\apex-metadata-custom\triggers\QuoteLineSyncTrigger.trigger`
- Handler references: QuoteSyncUtil;TriggerStopper
- Touchpoints:
  - TriggerHandler: QuoteSyncUtil;TriggerStopper (external_candidate=N)

## 15. Trigger QuoteSyncTrigger

- Score: 74
- Trigger context: `Quote` / `after insert,after update`
- Query/DML indicators: SOQL `2`, DML keywords `6`
- Summary: Trigger on Quote (after insert,after update)
- Source: `config\apex-metadata-custom\triggers\QuoteSyncTrigger.trigger`
- Handler references: QuoteSyncUtil;TriggerStopper
- Touchpoints:
  - TriggerHandler: QuoteSyncUtil;TriggerStopper (external_candidate=N)

## 16. Trigger dlrs_c2godaInvoiceTrigger

- Score: 64
- Trigger context: `c2g__codaInvoice__c` / `before delete,before insert,before update,after delete,after insert,after undelete,after update`
- Query/DML indicators: SOQL `0`, DML keywords `7`
- Summary: Trigger on c2g__codaInvoice__c (before delete,before insert,before update,after delete,after insert,after undelete,after update)
- Source: `config\apex-metadata-custom\triggers\dlrs_c2godaInvoiceTrigger.trigger`
- Custom object references: c2g__codaInvoice__c
- Touchpoints: none detected.

## 17. Trigger dlrs_AssetTrigger

- Score: 64
- Trigger context: `Asset` / `before delete,before insert,before update,after delete,after insert,after undelete,after update`
- Query/DML indicators: SOQL `0`, DML keywords `7`
- Summary: Trigger on Asset (before delete,before insert,before update,after delete,after insert,after undelete,after update)
- Source: `config\apex-metadata-custom\triggers\dlrs_AssetTrigger.trigger`
- Touchpoints: none detected.

## 18. Class GenericObjectOperationBatchLauncher

- Score: 57
- Class profile: callout `N`, rest `N`, invocable `Y`, async `Database.executeBatch`
- Query/DML indicators: SOQL `0`, DML keywords `8`
- Summary: GenericObjectOperationBatchLauncher: Flow invocable, async=Database.executeBatch
- Source: `config\apex-metadata-custom\classes\GenericObjectOperationBatchLauncher.cls`
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)
  - AsyncPattern: Database.executeBatch (external_candidate=N)

## 19. Class ProductMergeService

- Score: 46
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `3`, DML keywords `20`
- Summary: ProductMergeService: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ProductMergeService.cls`
- Touchpoints: none detected.

## 20. Trigger DisableFeedPostDeletes

- Score: 40
- Trigger context: `FeedItem` / `before delete`
- Query/DML indicators: SOQL `0`, DML keywords `1`
- Summary: Trigger on FeedItem (before delete)
- Source: `config\apex-metadata-custom\triggers\DisableFeedPostDeletes.trigger`
- Handler references: DisableChatterDeleteDelegate
- Touchpoints:
  - TriggerHandler: DisableChatterDeleteDelegate (external_candidate=N)

## 21. Trigger DisableFeedCommentDeletes

- Score: 40
- Trigger context: `FeedComment` / `before delete`
- Query/DML indicators: SOQL `0`, DML keywords `1`
- Summary: Trigger on FeedComment (before delete)
- Source: `config\apex-metadata-custom\triggers\DisableFeedCommentDeletes.trigger`
- Handler references: DisableChatterDeleteDelegate
- Touchpoints:
  - TriggerHandler: DisableChatterDeleteDelegate (external_candidate=N)

## 22. Class ResolveApprovalRequest

- Score: 35
- Class profile: callout `N`, rest `N`, invocable `Y`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: ResolveApprovalRequest: Flow invocable
- Source: `config\apex-metadata-custom\classes\ResolveApprovalRequest.cls`
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)

## 23. Class AgxPayableInvoiceRelease

- Score: 35
- Class profile: callout `N`, rest `N`, invocable `Y`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: AgxPayableInvoiceRelease: Flow invocable
- Source: `config\apex-metadata-custom\classes\AgxPayableInvoiceRelease.cls`
- Custom object references: c2g__codaPurchaseInvoice__c
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)

## 24. Class AgxPayableInvoiceHold

- Score: 35
- Class profile: callout `N`, rest `N`, invocable `Y`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: AgxPayableInvoiceHold: Flow invocable
- Source: `config\apex-metadata-custom\classes\AgxPayableInvoiceHold.cls`
- Custom object references: c2g__codaPurchaseInvoice__c
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)

## 25. Class GenericObjectOperationBatch

- Score: 34
- Class profile: callout `N`, rest `N`, invocable `N`, async `Database.Batchable`
- Query/DML indicators: SOQL `0`, DML keywords `13`
- Summary: GenericObjectOperationBatch: async=Database.Batchable
- Source: `config\apex-metadata-custom\classes\GenericObjectOperationBatch.cls`
- Touchpoints:
  - AsyncPattern: Database.Batchable (external_candidate=N)

## 26. Class DiscardInvoices

- Score: 33
- Class profile: callout `N`, rest `N`, invocable `Y`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: DiscardInvoices: Flow invocable
- Source: `config\apex-metadata-custom\classes\DiscardInvoices.cls`
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)

## 27. Class BusinessHoursCalculator

- Score: 33
- Class profile: callout `N`, rest `N`, invocable `Y`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: BusinessHoursCalculator: Flow invocable
- Source: `config\apex-metadata-custom\classes\BusinessHoursCalculator.cls`
- Touchpoints:
  - FlowInvocable: @InvocableMethod (external_candidate=N)

## 28. Class TPSCalloutTest

- Score: 30
- Class profile: callout `Y`, rest `N`, invocable `N`, async `Database.executeBatch`
- Query/DML indicators: SOQL `1`, DML keywords `1`
- Summary: TPSCalloutTest: HTTP/callout logic, async=Database.executeBatch
- Source: `config\apex-metadata-custom\classes\TPSCalloutTest.cls`
- Custom object references: TPS_Next_Check__c;TPS_Last_Checked__c;PhoneDNU__c;MobileDNU__c
- Touchpoints:
  - HttpCalloutLogic: HTTP/callout-related code detected (external_candidate=Y)
  - AsyncPattern: Database.executeBatch (external_candidate=N)

## 29. Class AccountAssetDisposalController

- Score: 30
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `5`, DML keywords `10`
- Summary: AccountAssetDisposalController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\AccountAssetDisposalController.cls`
- Custom object references: Line_of_Business__c;fferpcore__Company__c;Company_ERP__c;Funding_Type__c;Service_Termination_Notice_Date__c;Loss_Reason__c;Collection_Required__c;Collection_Fee__c;Collection_Contact__c;Collection_Date__c;Device_Settlement__c;Settlement_Fee__c;MACD__c;Account__c;Opportunity__c;Status__c;fferpcore__Status__c;MACD_Line_Item__c;Asset__c;MACD_Type__c;Date_Meters_Captured__c;Mono_Meter_Reading__c;Large_Mono_Readings__c;XLS_Meter_Readings__c;Colour_Meter_Readings__c;Large_Colour_Readings__c;XLS_Colour_Meter_Readings__c;Total_Impressions__c
- Touchpoints: none detected.

## 30. Class AssetDisposalWizardController

- Score: 24
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `5`, DML keywords `7`
- Summary: AssetDisposalWizardController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\AssetDisposalWizardController.cls`
- Custom object references: Line_of_Business__c;fferpcore__Company__c;Company_ERP__c;Funding_Type__c;MACD__c;Account__c;Opportunity__c;Status__c;MACD_Line_Item__c;Asset__c;MACD_Type__c;Date_Meters_Captured__c;Mono_Meter_Reading__c;Large_Mono_Readings__c;XLS_Meter_Readings__c;Colour_Meter_Readings__c;Large_Colour_Readings__c;XLS_Colour_Meter_Readings__c;Total_Impressions__c
- Touchpoints: none detected.

## 31. Class TPSCheckerScheduler

- Score: 16
- Class profile: callout `N`, rest `N`, invocable `N`, async `Schedulable;Database.executeBatch`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: TPSCheckerScheduler: async=Schedulable;Database.executeBatch
- Source: `config\apex-metadata-custom\classes\TPSCheckerScheduler.cls`
- Touchpoints:
  - AsyncPattern: Schedulable (external_candidate=N)
  - AsyncPattern: Database.executeBatch (external_candidate=N)

## 32. Class AutomaticCashMatching

- Score: 12
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `2`, DML keywords `4`
- Summary: AutomaticCashMatching: utility/business logic class
- Source: `config\apex-metadata-custom\classes\AutomaticCashMatching.cls`
- Custom object references: c2g__codaCashEntry__c;c2g__Reference__c;c2g__Value__c;c2g__Account__c;c2g__Status__c;c2g__codaInvoice__c;c2g__OutstandingValue__c;c2g__InvoiceStatus__c
- Touchpoints: none detected.

## 33. Class QuoteSyncTestSuite

- Score: 10
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `24`, DML keywords `54`
- Summary: QuoteSyncTestSuite: utility/business logic class
- Source: `config\apex-metadata-custom\classes\QuoteSyncTestSuite.cls`
- Touchpoints: none detected.

## 34. Class QuickLightningLookupController

- Score: 8
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `3`, DML keywords `1`
- Summary: QuickLightningLookupController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\QuickLightningLookupController.cls`
- Touchpoints: none detected.

## 35. Class ShowProductsController

- Score: 4
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `2`, DML keywords `0`
- Summary: ShowProductsController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ShowProductsController.cls`
- Custom object references: Product_Groups__c;Sub_Product__c;Product_Code__c;ProductCode__c;Quantity__c
- Touchpoints: none detected.

## 36. Class ShowAssets

- Score: 4
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `2`, DML keywords `0`
- Summary: ShowAssets: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ShowAssets.cls`
- Custom object references: Site_Account__c
- Touchpoints: none detected.

## 37. Class ShowAccessoriesManagedServices2Assign

- Score: 4
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `2`, DML keywords `0`
- Summary: ShowAccessoriesManagedServices2Assign: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ShowAccessoriesManagedServices2Assign.cls`
- Custom object references: Sub_Product__c;Quantity__c
- Touchpoints: none detected.

## 38. Class ShippingLabelController

- Score: 4
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `2`, DML keywords `0`
- Summary: ShippingLabelController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ShippingLabelController.cls`
- Custom object references: SCMC__Shipping__c;SCMC__Pick_list_Detail__c;SCMC__Quantity__c;SCMC__Sales_Order_Line_Item__c;SCMC__Unit_of_Measure__c;SCMC__Condition_Code__c;SCMC__Item_Description__c;SCMC__Shipper__c;SCMC__Location__c;Position_In_Warehouse__c;Lot_and_Serial_Numbers__c;SCMC__Serial_Number__c
- Touchpoints: none detected.

## 39. Class MassDeleteExtension

- Score: 4
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `2`
- Summary: MassDeleteExtension: utility/business logic class
- Source: `config\apex-metadata-custom\classes\MassDeleteExtension.cls`
- Touchpoints: none detected.

## 40. Class AccountUpdater

- Score: 4
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `1`
- Summary: AccountUpdater: utility/business logic class
- Source: `config\apex-metadata-custom\classes\AccountUpdater.cls`
- Touchpoints: none detected.

## 41. Class xerTransController

- Score: 2
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: xerTransController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\xerTransController.cls`
- Custom object references: c2g__codaTransactionLineItem__c;c2g__Account__c;c2g__TransactionDate__c;c2g__TransactionType__c;c2g__DocumentTotal__c;c2g__DocumentReference__c;c2g__DocumentDescription__c;c2g__DocumentValue__c;c2g__HomeOutstandingValue__c;c2g__DaysOverdue__c;c2g__DocumentNumber__c;Transaction_Age__c;c2g__HomeValue__c
- Touchpoints: none detected.

## 42. Class agxBankHoliday

- Score: 2
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: agxBankHoliday: utility/business logic class
- Source: `config\apex-metadata-custom\classes\agxBankHoliday.cls`
- Touchpoints: none detected.

## 43. Class DisableChatterDeleteDelegate

- Score: 2
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: DisableChatterDeleteDelegate: utility/business logic class
- Source: `config\apex-metadata-custom\classes\DisableChatterDeleteDelegate.cls`
- Custom object references: Chatter_Delete_Settings__c;Allow_Feed_Post_and_Comment_deletes__c
- Touchpoints: none detected.

## 44. Class CommissionPaymentController

- Score: 2
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: CommissionPaymentController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\CommissionPaymentController.cls`
- Custom object references: Commission_Payment__c;Suggested_Payment__c;Opportunity__c;Salesperson__c
- Touchpoints: none detected.

## 45. Class xerTransControllerTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `0`
- Summary: xerTransControllerTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\xerTransControllerTest.cls`
- Custom object references: c2g__codaTransactionLineItem__c
- Touchpoints: none detected.

## 46. Class dlrs_c2godaInvoiceTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `2`
- Summary: dlrs_c2godaInvoiceTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\dlrs_c2godaInvoiceTest.cls`
- Custom object references: c2g__codaCompany__c;c2g__codaInvoice__c;c2g__OwnerCompany__c;c2g__Account__c
- Touchpoints: none detected.

## 47. Class dlrs_OpportunityTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `4`
- Summary: dlrs_OpportunityTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\dlrs_OpportunityTest.cls`
- Custom object references: SCMC__Active__c;SCMC__Customer__c;SCMC__E_Mail__c;Approval_Status__c;Notifiy__c;Company_ERP__c;Lines_Of_Business__c;Estimated_Costs__c;Estimated_Revenue__c
- Touchpoints: none detected.

## 48. Class dlrs_OpportunityLineItemTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: dlrs_OpportunityLineItemTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\dlrs_OpportunityLineItemTest.cls`
- Touchpoints: none detected.

## 49. Class dlrs_AssetTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: dlrs_AssetTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\dlrs_AssetTest.cls`
- Touchpoints: none detected.

## 50. Class dlrs_AccountTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `1`
- Summary: dlrs_AccountTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\dlrs_AccountTest.cls`
- Touchpoints: none detected.

## 51. Class agxBankHolidayTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: agxBankHolidayTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\agxBankHolidayTest.cls`
- Touchpoints: none detected.

## 52. Class VantageApiInvoiceQueryTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: VantageApiInvoiceQueryTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\VantageApiInvoiceQueryTest.cls`
- Custom object references: Vantage_Invoice__c;Id__c;Reference__c;InvoiceDate__c;DueDate__c;BaseNetValue__c;BaseTotalValue__c;Account__c;Type__c;SubType__c
- Touchpoints: none detected.

## 53. Class VantageApiInvoiceLinesQueryTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: VantageApiInvoiceLinesQueryTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\VantageApiInvoiceLinesQueryTest.cls`
- Touchpoints: none detected.

## 54. Class TriggerStopper

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: TriggerStopper: utility/business logic class
- Source: `config\apex-metadata-custom\classes\TriggerStopper.cls`
- Touchpoints: none detected.

## 55. Class TestShippingLabelController

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `4`
- Summary: TestShippingLabelController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\TestShippingLabelController.cls`
- Custom object references: SCMC__Shipping__c;SCMC__Pick_list_Detail__c;SCMC__Sales_Order__c;SCMC__Package_Type__c;SCMC__Picklist__c;SCMC__Shipper__c;SCMC__Quantity__c
- Touchpoints: none detected.

## 56. Class TestAgxPayableInvoiceRelease

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `4`, DML keywords `0`
- Summary: TestAgxPayableInvoiceRelease: utility/business logic class
- Source: `config\apex-metadata-custom\classes\TestAgxPayableInvoiceRelease.cls`
- Custom object references: c2g__codaPurchaseInvoice__c;c2g__PaymentStatus__c;c2g__HoldStatus__c;c2g__InvoiceStatus__c
- Touchpoints: none detected.

## 57. Class TPSCheckerTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `Database.executeBatch`
- Query/DML indicators: SOQL `1`, DML keywords `1`
- Summary: TPSCheckerTest: async=Database.executeBatch
- Source: `config\apex-metadata-custom\classes\TPSCheckerTest.cls`
- Custom object references: Next_TPS_Check__c;Last_TPS_Checked__c;PhoneDNU__c
- Touchpoints:
  - AsyncPattern: Database.executeBatch (external_candidate=N)

## 58. Class TPSCheckerSchedulerTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `System.schedule`
- Query/DML indicators: SOQL `0`, DML keywords `2`
- Summary: TPSCheckerSchedulerTest: async=System.schedule
- Source: `config\apex-metadata-custom\classes\TPSCheckerSchedulerTest.cls`
- Custom object references: Next_TPS_Check__c
- Touchpoints:
  - AsyncPattern: System.schedule (external_candidate=N)

## 59. Class ShowProductsControllerTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `5`
- Summary: ShowProductsControllerTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ShowProductsControllerTest.cls`
- Custom object references: c2g__codaGeneralLedgerAccount__c;c2g__ReportingCode__c;c2g__Type__c;Product_Category__c;Category__c;GRNI_Accrual_Account__c;Cost_Of_Sales__c;Purchase_Analysis_Account__c;Inventory_GL_Code__c;Sales_Revenue_Account__c;Manufacturer__c;Product_Sub_Type__c;Product_Groups__c;Sub_Product__c
- Touchpoints: none detected.

## 60. Class ShowAssetsTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `5`
- Summary: ShowAssetsTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ShowAssetsTest.cls`
- Touchpoints: none detected.

## 61. Class ResolveApprovalRequestsTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `3`, DML keywords `0`
- Summary: ResolveApprovalRequestsTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ResolveApprovalRequestsTest.cls`
- Touchpoints: none detected.

## 62. Class QuoteSyncUtil

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: QuoteSyncUtil: utility/business logic class
- Source: `config\apex-metadata-custom\classes\QuoteSyncUtil.cls`
- Custom object references: custom_text__c;custom_checkbox__c;custom_currency__c;custom_date__c;custom_datetime__c;custom_email__c;custom_multipicklist__c;custom_number__c;custom_percent__c;custom_phone__c;custom_picklist__c;custom_rta__c;custom_url__c;QuoteSyncField__c;OppSyncField__c;QuoteLineSyncField__c;OppLineSyncField__c
- Touchpoints: none detected.

## 63. Class QuickLightningLookupControllerTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `2`
- Summary: QuickLightningLookupControllerTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\QuickLightningLookupControllerTest.cls`
- Touchpoints: none detected.

## 64. Class MassDeleteExtensionTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: MassDeleteExtensionTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\MassDeleteExtensionTest.cls`
- Touchpoints: none detected.

## 65. Class GenericObjectOperationBatchTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `Database.executeBatch`
- Query/DML indicators: SOQL `5`, DML keywords `19`
- Summary: GenericObjectOperationBatchTest: async=Database.executeBatch
- Source: `config\apex-metadata-custom\classes\GenericObjectOperationBatchTest.cls`
- Touchpoints:
  - AsyncPattern: Database.executeBatch (external_candidate=N)

## 66. Class DiscardInvoicesTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: DiscardInvoicesTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\DiscardInvoicesTest.cls`
- Touchpoints: none detected.

## 67. Class DisableChatterDeletesTestSuite

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `10`, DML keywords `51`
- Summary: DisableChatterDeletesTestSuite: utility/business logic class
- Source: `config\apex-metadata-custom\classes\DisableChatterDeletesTestSuite.cls`
- Custom object references: Chatter_Delete_Settings__c;Allow_Feed_Post_And_Comment_deletes__c
- Touchpoints: none detected.

## 68. Class ConductorFromListViewControllerTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `1`, DML keywords `1`
- Summary: ConductorFromListViewControllerTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ConductorFromListViewControllerTest.cls`
- Custom object references: Email_Sales_Invoice__c
- Touchpoints: none detected.

## 69. Class ConductorFromListViewController

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: ConductorFromListViewController: utility/business logic class
- Source: `config\apex-metadata-custom\classes\ConductorFromListViewController.cls`
- Custom object references: Email_Sales_Invoice__c
- Touchpoints: none detected.

## 70. Class CommissionPaymentControllerTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: CommissionPaymentControllerTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\CommissionPaymentControllerTest.cls`
- Custom object references: Commission_Payment__c
- Touchpoints: none detected.

## 71. Class CalloutHelperTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: CalloutHelperTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\CalloutHelperTest.cls`
- Touchpoints: none detected.

## 72. Class BusinessHoursCalculatorTest

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `0`, DML keywords `0`
- Summary: BusinessHoursCalculatorTest: utility/business logic class
- Source: `config\apex-metadata-custom\classes\BusinessHoursCalculatorTest.cls`
- Touchpoints: none detected.

## 73. Class AgxPayableInvoiceHoldTest2

- Score: 0
- Class profile: callout `N`, rest `N`, invocable `N`, async `None`
- Query/DML indicators: SOQL `4`, DML keywords `0`
- Summary: AgxPayableInvoiceHoldTest2: utility/business logic class
- Source: `config\apex-metadata-custom\classes\AgxPayableInvoiceHoldTest2.cls`
- Custom object references: c2g__codaPurchaseInvoice__c;SCMFFA__AP_Voucher__c;c2g__InvoiceStatus__c;c2g__PaymentStatus__c;c2g__HoldStatus__c
- Touchpoints: none detected.
