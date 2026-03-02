# Codex Handoff Prompt — Software Licensing Portal

> **Use this prompt to hand off implementation to Codex (or another AI coding agent).**  
> Copy/paste the prompt below. It references the docs in this repo.

---

## The Prompt

```
You are building a Software Licensing Portal for Xeretec. The architecture, field mappings,
integration design, validation rules, and backlog have already been produced and are in /docs/.

READ THESE FILES FIRST — they are your source of truth:
- /docs/solution-overview.md       — Architecture, tech stack, data model, security model
- /docs/salesforce-field-mapping.md — Every SF field the portal reads/writes, with types and rules
- /docs/integration-sequence.md    — SF Composite API payloads, auth flow, retry logic, API endpoints
- /docs/validation-rules.md        — All validation rules (portal-side + SF-side automation to account for)
- /docs/mvp-backlog.md             — Phased delivery plan with numbered stories

ALSO INSPECT the existing Salesforce metadata in /config/:
- /config/org-info.json            — Org alias, instance URL, API version
- /config/flow-metadata-active/    — All active Flow XML (Opportunity automation you must not break)
- /config/apex-metadata-custom/    — Custom Apex triggers on Opportunity + OpportunityLineItem
- /config/erd-opportunity-flow.mmd — Entity relationship diagram

THE PROJECT STRUCTURE already has:
- /frontend/  — Next.js app (app router with (portal) and login route groups)
- /backend/   — Express app structure (app/api, app/auth, app/models, app/services)
- /package.json — Root workspace (monorepo)

YOUR TASK: Implement Phase 1 MVP from /docs/mvp-backlog.md, stories M-01 through M-21.

IMPLEMENTATION RULES:
1. Use TypeScript everywhere (strict mode).
2. Frontend: Next.js 15 with App Router. Vanilla CSS for styling (dark theme, Xeretec red #E31937 accent).
3. Backend: Express + TypeScript. Use jsforce v3 for Salesforce integration.
4. Database: PostgreSQL with raw SQL migrations (no ORM). Store in /apps/api/migrations/.
5. Auth: Microsoft Entra ID OIDC → portal JWT in HTTP-only cookie.
6. SF Auth: OAuth 2.0 JWT Bearer flow via Connected App (server-to-server, env vars for credentials).
7. Use the Composite API for atomic Opportunity + OLI upsert (see /docs/integration-sequence.md §2.3).
8. External ID fields: Portal_Deal_Id__c (Opportunity) and Portal_Line_Id__c (OLI) — UUID v4.
9. Implement all validation rules from /docs/validation-rules.md §1.
10. Never set Opportunity.Name — let the SF Opportunity_Naming_Convention flow generate it.
11. Never submit at StageName = 'Closed Won' — use an earlier stage.
12. After SF insert, read-back the Opportunity to get the auto-generated Name.
13. Implement retry with exponential backoff for SF API 5xx/timeout (pg-boss queue).
14. Log every action in audit_event table (who, when, what, payload diff).
15. Use environment variables for all secrets (SF_CLIENT_ID, SF_PRIVATE_KEY, DB_URL, JWT_SECRET).

START WITH:
1. Set up the monorepo structure with workspaces.
2. Create the PostgreSQL migration for all portal tables (from /docs/solution-overview.md §7).
3. Implement the SF connection service with jsforce.
4. Implement the Account + Product sync service.
5. Build the deal creation form with validation.
6. Build the submit-to-SF flow with Composite API.
7. Add submission tracking and audit logging.

Work in small, testable steps. After each step, show what changed and how to test it.
```

---

## Notes for the Human

1. **Before running this prompt**, make sure Phase 0 prerequisites are done (see `/docs/mvp-backlog.md`):
   - External ID fields created in Salesforce
   - Connected App set up
   - Subscription field names confirmed
   - LOB picklist value confirmed

2. **If using Codex CLI**, you can run:

   ```
   codex --model o4-mini --full-auto "$(cat docs/codex-handoff-prompt.md)"
   ```

   But it's usually better to give it one story at a time (M-01, then M-02, etc.)
   rather than the whole MVP in one shot.

3. **Incremental approach** — give Codex individual stories:

   ```
   Read /docs/solution-overview.md and /docs/mvp-backlog.md.
   Implement story M-01: Project scaffold.
   Set up Next.js frontend in /frontend and Express API in /backend with TypeScript.
   Create package.json workspaces. Include dev scripts.
   ```

4. **After scaffold is done**, next prompt:

   ```
   Read /docs/integration-sequence.md §5 (Authentication Flow).
   Implement story M-02: SSO login with Microsoft Entra ID.
   Use next-auth with Azure AD provider for the frontend.
   Issue a portal JWT and store in HTTP-only cookie.
   Protect all /api/* routes with JWT validation middleware.
   ```

5. **For the SF integration**, give it:

   ```
   Read /docs/integration-sequence.md and /docs/salesforce-field-mapping.md.
   Implement stories M-03 through M-06: SF connection + data sync.
   Use jsforce v3 with JWT Bearer auth. Env vars: SF_CLIENT_ID, SF_PRIVATE_KEY,
   SF_USERNAME, SF_LOGIN_URL (https://test.salesforce.com for sandbox).
   Create sync services and portal DB tables for accounts, products, picklist values.
   ```

6. **For the form + submit flow**, give it:
   ```
   Read /docs/salesforce-field-mapping.md and /docs/validation-rules.md.
   Implement stories M-08 through M-20: Deal form, line items, validation, SF submit.
   Follow the Composite API payload format in /docs/integration-sequence.md §2.3.
   Map portal fields to SF fields per /docs/salesforce-field-mapping.md §5.
   Implement all V-OPP-* and V-OLI-* validation rules from /docs/validation-rules.md §1.
   ```
