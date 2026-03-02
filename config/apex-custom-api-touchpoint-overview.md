# Apex API Touchpoint Overview (Custom Namespace)

Generated: 2026-03-02 14:27:22 UTC

## Scope

- Org total Apex classes: 19,970 (managed + custom).
- Org total Apex triggers: 632 (managed + custom).
- Investigated custom classes (`NamespacePrefix = null`): 62
- Investigated custom triggers (`NamespacePrefix = null`): 11

## Findings

- Test classes detected: 28
- Artifacts with callout indicators: 8
- REST-exposed classes (`@RestResource`): 1
- Flow-invocable classes (`@InvocableMethod`): 9
- External-candidate touchpoints: 10

## Top Ranked Artifacts

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

## Touchpoint Types

- AsyncPattern: 10
- FlowInvocable: 9
- HttpCalloutLogic: 8
- TriggerHandler: 6
- HttpCalloutEndpoint: 1
- InboundREST: 1

## Trigger Object Distribution

- Opportunity: 2
- OpportunityLineItem: 2
- Account: 1
- QuoteLineItem: 1
- Quote: 1
- c2g__codaInvoice__c: 1
- Asset: 1
- FeedItem: 1
- FeedComment: 1

## Output Files

- `config\apex-custom-code-map.csv`
- `config\apex-custom-touchpoints.csv`
- `config\apex-custom-runbook-all.csv`
- `config\apex-custom-runbook-all.md`
- `config\apex-custom-api-touchpoint-overview.md`