# Solution Overview — Software Licensing Portal

> **Version:** 0.1-draft  
> **Date:** 2026-03-02  
> **Author:** Solution Architecture (auto-generated from Salesforce metadata discovery)  
> **Org:** `xeretec-sandfull01` (Sandbox Full) · API v66.0 · Multi-currency enabled

---

## 1. Business Context

Xeretec salespeople currently create software subscription Opportunities directly inside Salesforce.
This project builds an **external portal** that:

1. Lets salespeople search/select an Account (synced from Salesforce).
2. Create an Opportunity header with subscription-specific metadata.
3. Add software product line items with subscription fields.
4. Validate and submit.
5. Push data back into Salesforce as system of record.

### Core Reporting Rule — Two-Track Model

| Track                             | What it measures                                                | Timing               |
| --------------------------------- | --------------------------------------------------------------- | -------------------- |
| **Track 1 — Contract Wins**       | Count of deals + potential annual revenue + potential annual GP | At close/win         |
| **Track 2 — Realised Monthly GP** | Actual monthly GP from supplier invoices                        | When invoices arrive |

> **Critical:** For subscription/funding deals, the contract value must **never** be treated as realised monthly GP. The portal must keep win-metrics and realised-GP metrics separate.

---

## 2. System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USERS (Salespeople)                         │
│                  Browser / SSO Authentication                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              SOFTWARE LICENSING PORTAL (Frontend)                │
│   Next.js / React  ·  Hosted (Azure App Service / Vercel)        │
│   ───────────────────────────────────────────────────────────     │
│   • Account search/select                                        │
│   • Opportunity form (header + line items)                       │
│   • Validation engine (client-side pre-check)                    │
│   • Submission status dashboard                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST / JSON
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              PORTAL API SERVICE (Backend)                         │
│   Node.js / Express · TypeScript                                 │
│   ───────────────────────────────────────────────────────────     │
│   • Auth middleware (JWT / SSO token validation)                  │
│   • Validation service (mirrors SF rules)                        │
│   • Salesforce sync service (jsforce / SF REST API)              │
│   • Idempotent upsert engine (external ID strategy)              │
│   • Audit logging service                                        │
│   • Error queue / dead-letter handler                             │
│   • Portal DB (PostgreSQL)                                       │
└──────────────────────────┬───────────────────────────────────────┘
                           │ SF REST API v66.0
                           │ OAuth 2.0 Connected App
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SALESFORCE ORG                                 │
│   Opportunity · OpportunityLineItem · Account · Product2         │
│   PricebookEntry · OpportunitySplit                              │
│   ─────────────────────────────────────────────────────────────   │
│   Post-save automation (fires on insert/update):                 │
│   • Opportunity_Naming_Convention (before save — renames opp)    │
│   • ION_CreateSalesOrder_PB_2 (after save — creates Sales Order) │
│   • Opportunity_Calculate_Contractual_Split (after save)         │
│   • Opportunity_Compliance_Calculation (after save)              │
│   • dlrs (Declarative Lookup Rollup Summaries)                   │
│   • OppSyncTrigger / OppLineSyncTrigger (Quote sync)             │
│   • Commission flows (on OLI / OpportunitySplit)                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Architecture Principles

| #   | Principle                                                                 | Rationale                                                                                                                                |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Salesforce is system of record**                                        | Portal creates/updates; final authority stays in SF                                                                                      |
| 2   | **Idempotent upsert**                                                     | Every portal submission uses an external ID; retries never duplicate                                                                     |
| 3   | **Let SF automation run**                                                 | After Opp insert, SF flows auto-name, create Sales Orders, calc splits. Portal does NOT replicate this logic — it waits for SF to settle |
| 4   | **Client-side validation = fast feedback; Server-side = source of truth** | Validate twice: in portal UI (fast) and in API service (authoritative) before SF push                                                    |
| 5   | **Audit everything**                                                      | Every create, update, retry, failure logged with user, timestamp, payload diff                                                           |
| 6   | **Least privilege**                                                       | Connected App scoped to Opportunity, OLI, Account, Product2, PricebookEntry; no admin-level access                                       |
| 7   | **Secrets never in code**                                                 | All credentials via environment variables / Azure Key Vault                                                                              |

---

## 4. Technology Stack

| Layer              | Technology                                          | Justification                                                             |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------------------- |
| **Frontend**       | Next.js 15 (React) + TypeScript                     | SSR for auth, type safety, component model                                |
| **Styling**        | Vanilla CSS + CSS custom properties                 | Full control, Xeretec brand alignment                                     |
| **Backend API**    | Node.js + Express + TypeScript                      | Same language as frontend, jsforce library mature                         |
| **SF Integration** | jsforce v3 (SF REST API v66)                        | Battle-tested, supports composite API, bulk, describe                     |
| **Database**       | PostgreSQL 16                                       | Audit log, submission tracking, sync job queue, idempotent external IDs   |
| **Auth**           | Microsoft Entra ID (SSO) → JWT                      | Xeretec already on Microsoft; no SF user licenses needed for portal users |
| **Queue/Retry**    | pg-boss (PostgreSQL-backed job queue)               | Lightweight; no additional infrastructure; dead-letter built-in           |
| **Deployment**     | Docker → Azure App Service (or Vercel for frontend) | Enterprise-ready, CI/CD friendly                                          |

---

## 5. Data Flow — Happy Path

```
 User fills form → Portal Frontend
     │
     ▼
 POST /api/deals/submit
     │
     ▼
 Backend validates (field rules, required fields, picklist values)
     │  ✗ → return field-level errors to UI
     ▼  ✓
 Insert row into portal DB: Submission(status=pending)
     │
     ▼
 Upsert Opportunity via SF REST API
   - External_ID = Portal_Deal_Id__c
   - Use Composite API: Opportunity + OpportunityLineItems in one call
     │  ✗ → update Submission(status=failed), log error, enqueue retry
     ▼  ✓
 Store returned SF IDs in portal DB
 Update Submission(status=synced)
     │
     ▼
 SF post-save automation fires:
   • Opportunity_Naming_Convention (auto-renames)
   • ION_CreateSalesOrder_PB_2 (creates Sales Order if Closed Won)
   • dlrs rollups recalculate
   • Commission flows fire
     │
     ▼
 Portal polls / callback to fetch final Opportunity Name + SO status
 Update portal DB with final SF state
     │
     ▼
 Return success + SF Opportunity link to user
```

---

## 6. Critical Salesforce Automation Impact

> These automations fire when we insert/update Opportunity or OpportunityLineItem.
> The portal **must not fight them** — it must work _with_ them.

### 6.1 Opportunity-Triggered Flows

| Flow                                      | Trigger                          | Impact on Portal                                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Opportunity_Naming_Convention`           | RecordBeforeSave (create+update) | **Auto-generates Opportunity Name** from Account Number + counter + quarter + LOB. Portal should NOT set Name — let SF generate it.                                                              |
| `ION_CreateSalesOrder_PB_2`               | RecordAfterSave (create+update)  | Fires when `StageName = 'Closed Won'` AND `IWM_Sales_Order_Req__c = true` AND `link_Opp2SO_State__c ≠ 'Ok'`. Creates Sales Order via Certinia messaging. Portal must set these fields correctly. |
| `ION_CreateSalesOrder_PB`                 | onAllChanges (process builder)   | Fires when `IWM_Sales_Order_Type__c` changes. Triggers SO creation and calls `ION_UpdateOppWithSORecType` subflow.                                                                               |
| `Opportunity_Compliance_Calculation`      | RecordAfterSave                  | Fires when `Approval_Status__c = 'Approved'`. Calculates compliance timing.                                                                                                                      |
| `Opportunity_Calculate_Contractual_Split` | RecordAfterSave                  | Calculates `Sales_Person_Deal_Revenue__c` and `Sales_Person_Deal_Profit__c` on OpportunitySplit from `Contractual_Revenue__c` and `Contractual_Profit__c`.                                       |
| `Set_Opportunity_Owner`                   | RecordBeforeSave                 | Checks `Lines_Of_Business__c` to assign owner.                                                                                                                                                   |

### 6.2 Opportunity Triggers (Apex)

| Trigger                   | Events       | Impact                                                                                 |
| ------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `dlrs_OpportunityTrigger` | All events   | Declarative Lookup Rollup Summaries. Read-only effect for portal.                      |
| `OppSyncTrigger`          | after update | Syncs Opportunity fields to synced Quote. Portal deals should NOT have a synced quote. |

### 6.3 OpportunityLineItem Triggers

| Trigger                           | Events                                    | Impact                                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlrs_OpportunityLineItemTrigger` | All events                                | DLRS rollups. Read-only effect.                                                                                                                                                                 |
| `OppLineSyncTrigger`              | before insert, after insert, after update | Syncs OLI fields to QuoteLineItem. **before insert populates required fields** via `QuoteSyncUtil.populateRequiredFields()` — only in test context. Portal must supply all required OLI fields. |

---

## 7. Portal Data Model (Internal)

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ AccountRef   │     │ Deal          │     │ DealLineItem   │
│─────────────│     │──────────────│     │───────────────│
│ id (PK)      │◄───┤ accountRefId  │     │ id (PK)        │
│ sf_account_id│     │ id (PK)       │◄───┤ dealId (FK)    │
│ name         │     │ sf_opp_id     │     │ sf_oli_id      │
│ account_no   │     │ stage         │     │ product2_id    │
│ is_active    │     │ close_date    │     │ pricebook_entry│
│ synced_at    │     │ lob           │     │ quantity       │
└─────────────┘     │ funding_type  │     │ unit_price     │
                    │ currency_code │     │ sales_cost     │
                    │ created_by    │     │ product_cond   │
                    │ status        │     │ contract_type  │
                    └──────────────┘     │ sub_billing_com│
                                         │ sub_start_date │
┌──────────────┐     ┌──────────────┐    │ sub_term_months│
│ Submission    │     │ SyncJob       │    │ sub_billing_pln│
│──────────────│     │──────────────│    └───────────────┘
│ id (PK)      │     │ id (PK)       │
│ dealId (FK)  │     │ submissionId  │    ┌───────────────┐
│ status       │     │ direction     │    │ AuditEvent     │
│ sf_opp_id    │     │ object_type   │    │───────────────│
│ submitted_at │     │ sf_record_id  │    │ id (PK)        │
│ submitted_by │     │ status        │    │ entity_type    │
│ error_detail │     │ attempt_count │    │ entity_id      │
│ retry_count  │     │ last_error    │    │ action         │
│ last_attempt │     │ created_at    │    │ user_id        │
└──────────────┘     │ completed_at  │    │ timestamp      │
                     └──────────────┘    │ payload_diff   │
                                         └───────────────┘
```

---

## 8. Security Model

| Concern                 | Approach                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **User Authentication** | Microsoft Entra ID SSO (SAML/OIDC) → portal issues JWT                                                                   |
| **API Authorization**   | JWT validation middleware; role-based (salesperson / admin)                                                              |
| **Salesforce Auth**     | OAuth 2.0 JWT Bearer flow via Connected App (server-to-server, no user interaction)                                      |
| **Secrets**             | Environment variables in production; Azure Key Vault for rotation                                                        |
| **Data in Transit**     | TLS 1.3 everywhere (portal↔user, portal↔SF)                                                                              |
| **Data at Rest**        | PostgreSQL with encrypted storage; SF handles its own encryption                                                         |
| **Audit**               | Every API call logged with user identity, timestamp, request/response hash                                               |
| **Least Privilege**     | Connected App profile limited to: Opportunity (CRUD), OLI (CRUD), Account (Read), Product2 (Read), PricebookEntry (Read) |

---

## 9. Error Handling & Retry Strategy

```
Submission attempt
    │
    ├─ SF API returns 2xx → mark synced, store SF IDs
    │
    ├─ SF API returns 4xx (validation error) → mark failed
    │   │  Parse field-level errors from SF response
    │   │  Return to user with actionable error messages
    │   └─ Do NOT auto-retry (user must fix data)
    │
    ├─ SF API returns 5xx / timeout → mark pending_retry
    │   │  Enqueue in pg-boss with exponential backoff
    │   │  Max 5 retries (1m, 5m, 15m, 30m, 60m)
    │   │  Idempotent upsert ensures no duplicates
    │   └─ After max retries → move to dead letter queue
    │
    └─ Network failure → same as 5xx path
```

---

## 10. Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│           Azure Resource Group                   │
│                                                  │
│  ┌──────────────┐    ┌──────────────────┐        │
│  │ App Service   │    │ App Service       │       │
│  │ (Frontend)    │────│ (API)             │       │
│  │ Next.js SSR   │    │ Express + jsforce │       │
│  └──────────────┘    └────────┬─────────┘        │
│                               │                   │
│                    ┌──────────┴──────────┐        │
│                    │ Azure PostgreSQL     │        │
│                    │ Flexible Server      │        │
│                    └─────────────────────┘        │
│                                                   │
│  ┌──────────────────────────────┐                 │
│  │ Azure Key Vault               │                │
│  │ SF_CLIENT_ID, SF_PRIVATE_KEY  │                │
│  │ DB connection string          │                │
│  │ JWT signing key               │                │
│  └──────────────────────────────┘                 │
└─────────────────────────────────────────────────┘
          │
          │ SF REST API (HTTPS)
          ▼
    Salesforce Org
```

---

## 11. What Metadata Is Still Missing

> **Action required:** The following items were NOT found in the current config exports.  
> I need these to complete the field mapping specification.

| #   | Missing Item                                                                                                                       | Why Needed                                              | How to Get                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Opportunity field describe** (all custom fields, types, picklist values, required flags)                                         | Complete field mapping                                  | `sf data query --use-tooling-api --query "SELECT QualifiedApiName, DataType, IsRequired, Description FROM EntityParticle WHERE EntityDefinition.QualifiedApiName = 'Opportunity' AND IsCustom = true"` |
| 2   | **OpportunityLineItem field describe**                                                                                             | Complete OLI field mapping                              | Same query with `'OpportunityLineItem'`                                                                                                                                                                |
| 3   | **Record Types for Opportunity**                                                                                                   | Know which RecordTypeId to set                          | `sf data query --query "SELECT Id, Name, DeveloperName, IsActive FROM RecordType WHERE SObjectType = 'Opportunity'"`                                                                                   |
| 4   | **Picklist values** for: `Lines_Of_Business__c`, `Funding_Type__c`, `StageName`, `IWM_Sales_Order_Type__c`, `Product_Condition__c` | Populate dropdowns, validate on submit                  | `sf sobject describe Opportunity --json`                                                                                                                                                               |
| 5   | **Validation Rules** on Opportunity and OpportunityLineItem                                                                        | Mirror in portal validation                             | `sf project retrieve start --metadata ValidationRule:Opportunity.*`                                                                                                                                    |
| 6   | **Page Layouts** for Opportunity (especially the Software record type)                                                             | Understand field grouping and required-on-layout fields | `sf project retrieve start --metadata Layout:Opportunity-*`                                                                                                                                            |
| 7   | **External ID fields** (do they already exist on Opportunity/OLI?)                                                                 | Needed for idempotent upsert                            | Describe output will show `IsExternalId` flag                                                                                                                                                          |
| 8   | **Pricebook names** and which one is used for software subscriptions                                                               | Correct PricebookEntry lookups                          | `sf data query --query "SELECT Id, Name, IsActive, IsStandard FROM Pricebook2 WHERE IsActive = true"`                                                                                                  |

---

## 12. Assumptions (to validate with stakeholders)

1. **Software-only scope:** This portal handles only software subscription opportunities, not hardware/print.
2. **Lines of Business:** Portal will default to "Software" or a specific LOB picklist value — need confirmation of exact value.
3. **Stage:** New submissions will start at an early stage (e.g., "Prospecting" or "Qualification") — need confirmation.
4. **No Quote sync:** Portal-created Opportunities will NOT have a synced Quote, so OppSyncTrigger / OppLineSyncTrigger should be benign.
5. **Approval process:** The portal will submit Opportunities in a pre-approval stage. Compliance/technical approval continues in Salesforce.
6. **Currency:** Multi-currency is enabled. Portal must capture CurrencyIsoCode and match PricebookEntry currency.
7. **Sales Order creation:** Happens automatically in SF when Opp hits Closed Won. Portal does NOT create Sales Orders directly.
8. **Commission flows:** Fire automatically on OLI/Split creation. Portal does not need to manage commissions.
