# Integration Sequence Design

> **Version:** 0.1-draft  
> **Date:** 2026-03-02  
> **API Version:** Salesforce REST API v66.0  
> **Auth:** OAuth 2.0 JWT Bearer (Connected App, server-to-server)

---

## 1. Read Path — Reference Data Sync

### 1.1 Account Sync (Periodic + On-Demand)

```
Portal API                                  Salesforce
    │                                           │
    │  GET /services/data/v66.0/query           │
    │  ?q=SELECT Id, Name, Account_Number_aoc__c,│
    │    SCMC__Active__c, SCMC__Customer__c,     │
    │    SCMC__E_Mail__c, BillingCity,           │
    │    BillingPostalCode, RecordType.Name       │
    │    FROM Account                             │
    │    WHERE RecordType.Name != 'Supplier'      │
    │    AND SCMC__Active__c = true               │
    │    ORDER BY Name                            │
    │    LIMIT 2000                               │
    │─────────────────────────────────────────────►│
    │                                              │
    │◄─────────────────────────── 200 OK ──────────│
    │  { records: [...], nextRecordsUrl: ... }     │
    │                                              │
    ▼                                              │
  Upsert into portal.account_ref table             │
  (sf_account_id as natural key)                   │
```

**Schedule:** Nightly full sync + on-demand search via SOSL.

**On-demand search (typeahead):**

```
GET /services/data/v66.0/search
  ?q=FIND {xeretec*} IN NAME FIELDS
   RETURNING Account(Id, Name, Account_Number_aoc__c, BillingCity)
```

### 1.2 Product + Pricebook Sync (Periodic)

```
Portal API                                  Salesforce
    │                                           │
    │  SELECT Id, Product2Id, Product2.Name,     │
    │    Product2.IsActive,                      │
    │    Product2.Product_Sub_Type__c,            │
    │    Product2.Line_of_Business__c,            │
    │    UnitPrice, CurrencyIsoCode,              │
    │    Pricebook2Id, Pricebook2.Name            │
    │  FROM PricebookEntry                        │
    │  WHERE Product2.IsActive = true             │
    │    AND Pricebook2.IsActive = true           │
    │    AND IsActive = true                      │
    │─────────────────────────────────────────────►│
    │                                              │
    │◄─────────────────────────── 200 OK ──────────│
    │                                              │
    ▼                                              │
  Upsert into portal.product_ref +                 │
  portal.pricebook_entry_ref tables                │
```

**Schedule:** Nightly sync. Products change infrequently.

---

## 2. Write Path — Opportunity + Line Items

### 2.1 Composite API Strategy

Use the **Salesforce Composite API** to create Opportunity + OLIs in a single transaction.
This ensures atomicity — if any OLI fails, the entire batch rolls back.

```
POST /services/data/v66.0/composite
Content-Type: application/json
Authorization: Bearer {access_token}
```

### 2.2 Full Sequence Diagram

```
User          Portal Frontend       Portal API           Portal DB         Salesforce
  │                  │                   │                    │                  │
  │  Fill form       │                   │                    │                  │
  │─────────────────►│                   │                    │                  │
  │                  │                   │                    │                  │
  │                  │ POST /api/deals   │                    │                  │
  │                  │──────────────────►│                    │                  │
  │                  │                   │                    │                  │
  │                  │                   │ Validate fields    │                  │
  │                  │                   │ (required, picklist│                  │
  │                  │                   │  values, types)    │                  │
  │                  │                   │                    │                  │
  │                  │                   │ INSERT Deal +      │                  │
  │                  │                   │ DealLineItems      │                  │
  │                  │                   │───────────────────►│                  │
  │                  │                   │                    │                  │
  │                  │                   │ INSERT Submission  │                  │
  │                  │                   │ (status=pending)   │                  │
  │                  │                   │───────────────────►│                  │
  │                  │                   │                    │                  │
  │                  │                   │ POST /composite    │                  │
  │                  │                   │ (Opp upsert +      │                  │
  │                  │                   │  OLI upserts)      │                  │
  │                  │                   │───────────────────────────────────────►│
  │                  │                   │                    │                  │
  │                  │                   │                    │       Opp created │
  │                  │                   │                    │    Flows fire:    │
  │                  │                   │                    │  • Naming Conv    │
  │                  │                   │                    │  • Set Owner      │
  │                  │                   │                    │  • DLRS rollups   │
  │                  │                   │                    │  • Contractual    │
  │                  │                   │                    │    Split calc     │
  │                  │                   │                    │                  │
  │                  │                   │◄──────────────────────── 200 OK ──────│
  │                  │                   │  { compositeResponse: [               │
  │                  │                   │    { id: "006...", success: true },    │
  │                  │                   │    { id: "00k...", success: true },    │
  │                  │                   │    ...                                │
  │                  │                   │  ]}                                   │
  │                  │                   │                    │                  │
  │                  │                   │ UPDATE Submission  │                  │
  │                  │                   │ (status=synced,    │                  │
  │                  │                   │  sf_opp_id=006..)  │                  │
  │                  │                   │───────────────────►│                  │
  │                  │                   │                    │                  │
  │                  │                   │ INSERT SyncJob     │                  │
  │                  │                   │ records per object │                  │
  │                  │                   │───────────────────►│                  │
  │                  │                   │                    │                  │
  │                  │                   │ INSERT AuditEvent  │                  │
  │                  │                   │───────────────────►│                  │
  │                  │                   │                    │                  │
  │                  │◄──────────────────│                    │                  │
  │                  │  { success: true, │                    │                  │
  │                  │    sfOppId: "006.."│                   │                  │
  │                  │    sfOppUrl: "..." │                   │                  │
  │                  │  }                │                    │                  │
  │◄─────────────────│                   │                    │                  │
  │  Show success    │                   │                    │                  │
  │  + SF link       │                   │                    │                  │
```

### 2.3 Composite API Payload

```json
{
  "allOrNone": true,
  "compositeRequest": [
    {
      "method": "PATCH",
      "url": "/services/data/v66.0/sobjects/Opportunity/Portal_Deal_Id__c/3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      "referenceId": "opp",
      "body": {
        "AccountId": "001XXXXXXXXXXXXXXX",
        "StageName": "Qualification",
        "CloseDate": "2026-06-30",
        "Lines_Of_Business__c": "Software",
        "Funding_Type__c": "Subscription",
        "CurrencyIsoCode": "GBP",
        "IWM_Sales_Order_Req__c": true,
        "OwnerId": "005XXXXXXXXXXXXXXX"
      }
    },
    {
      "method": "PATCH",
      "url": "/services/data/v66.0/sobjects/OpportunityLineItem/Portal_Line_Id__c/6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "referenceId": "oli_1",
      "body": {
        "OpportunityId": "@{opp.id}",
        "PricebookEntryId": "01uXXXXXXXXXXXXXXX",
        "Quantity": 10,
        "UnitPrice": 49.99,
        "Product_Condition__c": "New"
      }
    },
    {
      "method": "PATCH",
      "url": "/services/data/v66.0/sobjects/OpportunityLineItem/Portal_Line_Id__c/7cb8c921-ae9e-22e2-91c5-11d15fe541d9",
      "referenceId": "oli_2",
      "body": {
        "OpportunityId": "@{opp.id}",
        "PricebookEntryId": "01uYYYYYYYYYYYYYYY",
        "Quantity": 5,
        "UnitPrice": 99.0,
        "Product_Condition__c": "New"
      }
    }
  ]
}
```

**Key design decisions:**

- `allOrNone: true` — atomic transaction, no partial creates
- PATCH with External ID — idempotent upsert; safe to retry
- `@{opp.id}` — Composite API reference to the Opportunity created in the same request
- OLI references Opportunity via composite reference, avoiding a second API call

---

## 3. Error Path — Retry Sequence

```
Portal API                          pg-boss Queue              Salesforce
    │                                    │                        │
    │  SF API returns 5xx / timeout      │                        │
    │◄──────────────────────────────────────────────── ERROR ──────│
    │                                    │                        │
    │  UPDATE Submission                 │                        │
    │  (status=pending_retry,            │                        │
    │   error_detail=...)                │                        │
    │                                    │                        │
    │  Enqueue retry job                 │                        │
    │──────────────────────────────────►│                        │
    │  { dealId, attempt: 1,             │                        │
    │    delay: 60s }                    │                        │
    │                                    │                        │
    │            ... 60s later ...       │                        │
    │                                    │                        │
    │◄─────────── Job picked up ─────────│                        │
    │                                    │                        │
    │  Retry same Composite API call     │                        │
    │  (idempotent — External ID upsert) │                        │
    │───────────────────────────────────────────────────────────►│
    │                                    │                        │
    │  If success: UPDATE Submission     │                        │
    │  (status=synced)                   │                        │
    │                                    │                        │
    │  If fail + attempt < 5:            │                        │
    │  Re-enqueue with backoff           │                        │
    │──────────────────────────────────►│                        │
    │  { attempt: 2, delay: 300s }       │                        │
    │                                    │                        │
    │  If fail + attempt >= 5:           │                        │
    │  UPDATE Submission                 │                        │
    │  (status=dead_letter)              │                        │
    │  INSERT AuditEvent (escalation)    │                        │
```

**Retry schedule:**

| Attempt | Delay      | Cumulative Wait |
| ------- | ---------- | --------------- |
| 1       | 1 minute   | 1 min           |
| 2       | 5 minutes  | 6 min           |
| 3       | 15 minutes | 21 min          |
| 4       | 30 minutes | 51 min          |
| 5       | 60 minutes | 1h 51min        |

---

## 4. Read-Back Path — Post-Submit Verification

After successful sync, the portal fetches the final state from SF to capture auto-generated values:

```
Portal API                                  Salesforce
    │                                           │
    │  GET /services/data/v66.0/sobjects/        │
    │    Opportunity/{sfOppId}                    │
    │    ?fields=Id,Name,StageName,              │
    │      link_Opp2SO_State__c,                 │
    │      link_Opp2SO_Id__c,                    │
    │      Approval_Status__c,                    │
    │      Amount                                 │
    │─────────────────────────────────────────────►│
    │                                              │
    │◄─────────────────────────── 200 OK ──────────│
    │  { Name: "XER001/042/Q2/Software", ... }     │
    │                                              │
    ▼                                              │
  UPDATE Deal in portal DB:                        │
  - sf_opp_name = "XER001/042/Q2/Software"         │
  - so_state = link_Opp2SO_State__c                │
```

**Why:** The `Opportunity_Naming_Convention` flow auto-generates a name we can't predict. We need to read it back for the portal UI.

---

## 5. Authentication Flow

```
                                           Microsoft
User (Browser)                             Entra ID          Portal API       Salesforce
    │                                         │                  │                │
    │  Navigate to portal                     │                  │                │
    │────────────────────────────────────────►│                  │                │
    │                                         │                  │                │
    │◄──────────── OIDC redirect ─────────────│                  │                │
    │                                         │                  │                │
    │  Login with corporate credentials       │                  │                │
    │────────────────────────────────────────►│                  │                │
    │                                         │                  │                │
    │◄──── Authorization code ────────────────│                  │                │
    │                                         │                  │                │
    │  Exchange code for tokens               │                  │                │
    │─────────────────────────────────────────────────────────►│                │
    │                                         │                  │                │
    │                                         │  Validate token  │                │
    │                                         │  Map email →     │                │
    │                                         │  SF User ID      │                │
    │                                         │  Issue portal JWT│                │
    │                                         │                  │                │
    │◄─────────────────────── Set HTTP-only cookie ─────────────│                │
    │                                         │                  │                │
    │  Subsequent API calls include JWT       │                  │                │
    │─────────────────────────────────────────────────────────►│                │
    │                                         │                  │                │
    │                                         │                  │  SF API calls  │
    │                                         │                  │  use JWT Bearer│
    │                                         │                  │  (server-side  │
    │                                         │                  │   Connected App│
    │                                         │                  │   — NOT user   │
    │                                         │                  │   context)     │
    │                                         │                  │───────────────►│
```

---

## 6. API Endpoints (Portal Backend)

| Method   | Path                            | Description                      | SF Interaction           |
| -------- | ------------------------------- | -------------------------------- | ------------------------ |
| `GET`    | `/api/accounts`                 | Search/list accounts             | SOSL/SOQL query          |
| `GET`    | `/api/accounts/:id`             | Get account detail               | SOQL by ID               |
| `GET`    | `/api/products`                 | List active products with prices | From portal cache        |
| `GET`    | `/api/products?lob=Software`    | Filter products by LOB           | From portal cache        |
| `GET`    | `/api/pricebooks`               | List active pricebooks           | From portal cache        |
| `GET`    | `/api/picklists/:object/:field` | Get picklist values              | SF Describe API          |
| `POST`   | `/api/deals`                    | Create new deal (save draft)     | Portal DB only           |
| `PUT`    | `/api/deals/:id`                | Update deal draft                | Portal DB only           |
| `GET`    | `/api/deals/:id`                | Get deal with line items         | Portal DB                |
| `GET`    | `/api/deals`                    | List user's deals                | Portal DB                |
| `POST`   | `/api/deals/:id/lines`          | Add line item to deal            | Portal DB only           |
| `PUT`    | `/api/deals/:id/lines/:lineId`  | Update line item                 | Portal DB only           |
| `DELETE` | `/api/deals/:id/lines/:lineId`  | Remove line item                 | Portal DB only           |
| `POST`   | `/api/deals/:id/submit`         | Validate + push to SF            | Composite API upsert     |
| `GET`    | `/api/deals/:id/status`         | Check sync status                | Portal DB + SF read-back |
| `GET`    | `/api/submissions`              | List submissions with status     | Portal DB                |
| `POST`   | `/api/submissions/:id/retry`    | Manual retry a failed submission | Re-enqueue job           |

---

## 7. Rate Limits & Safeguards

| Concern                | Safeguard                                                    |
| ---------------------- | ------------------------------------------------------------ |
| SF API daily limit     | Track usage; alert at 80% threshold                          |
| SF Composite API limit | Max 25 subrequests per call (1 Opp + up to 24 OLIs per call) |
| Concurrent submissions | Queue-based processing; max 5 concurrent SF API calls        |
| Large accounts dataset | Paginate with `nextRecordsUrl`; cache in portal DB           |
| SF maintenance windows | Retry logic handles temporary unavailability                 |
