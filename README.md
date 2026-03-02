# Sales Management Portal

Sales Management Portal with:
- `frontend/`: Next.js (TypeScript) + Tailwind
- `backend/`: FastAPI (Python)
- Okta OIDC for internal user auth
- Salesforce Sandbox integration via OAuth 2.0 JWT Bearer Flow (single integration user)
- Conga Composer trigger endpoint for Quote PDF generation

The current default mode is mocked backend data (`SF_USE_MOCK_DATA=true`) so the app runs end-to-end locally before enabling Salesforce/Conga.

## Project Structure

```text
.
├── backend
│   ├── app
│   │   ├── api
│   │   ├── auth
│   │   ├── models
│   │   └── services
│   └── requirements.txt
├── frontend
│   ├── app
│   ├── components
│   ├── lib
│   └── package.json
└── .env.example
```

## Local Setup

1. Copy `.env.example` to `.env` and populate values.
2. Backend setup:
   ```bash
   cd backend
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Linux/macOS
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
3. Frontend setup:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Environment Variables

Core values are listed in `.env.example`. Required keys:

```dotenv
OKTA_ISSUER=
OKTA_AUDIENCE=
OKTA_CLIENT_ID=
OKTA_CLIENT_SECRET=
SF_LOGIN_URL=https://test.salesforce.com
SF_CLIENT_ID=
SF_USERNAME=
SF_PRIVATE_KEY_PATH=
CONGA_BASE_URL=
CONGA_TEMPLATE_ID=
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Frontend public keys:

```dotenv
NEXT_PUBLIC_OKTA_ISSUER=
NEXT_PUBLIC_OKTA_CLIENT_ID=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Notes:
- `NEXT_PUBLIC_OKTA_ISSUER` should match `OKTA_ISSUER`.
- `NEXT_PUBLIC_OKTA_CLIENT_ID` should match `OKTA_CLIENT_ID` for frontend sign-in.
- Backend validates access tokens against `OKTA_ISSUER`, `OKTA_AUDIENCE`, and JWKS signature.

## Okta Setup Notes

1. Create an OIDC app integration for SPA (frontend login).
2. Add redirect URI:
   - `http://localhost:3000/login/callback`
3. Add post-logout redirect URI:
   - `http://localhost:3000/login`
4. Ensure access token includes `groups` claim:
   - Add groups claim in authorization server (filter `SalesPortal_*` recommended).
5. Create and assign groups:
   - `SalesPortal_Admin`
   - `SalesPortal_Sales`
   - `SalesPortal_ReadOnly`

Authorization behavior in backend:
- Read endpoints: any of the 3 groups.
- Write endpoints (`PATCH /api/opportunities/{id}`, `POST /api/quotes/{id}/generate`): `SalesPortal_Admin` or `SalesPortal_Sales`.

## Salesforce Connected App + JWT Bearer (Sandbox)

1. In Salesforce Sandbox, create a Connected App.
2. Enable OAuth and JWT bearer flow:
   - Consumer Key => `SF_CLIENT_ID`
   - Upload certificate matching your private key (`SF_PRIVATE_KEY_PATH` PEM pair).
3. Configure integration user and pre-authorize app policies.
4. Set:
   - `SF_LOGIN_URL=https://test.salesforce.com`
   - `SF_USERNAME=<integration-user-username>`
5. Keep `SF_USE_MOCK_DATA=true` for local mock mode, then set to `false` to query Salesforce.

Salesforce service methods available:
- `get_access_token()`
- `soql_query(soql: str)`
- `get_record(sobject: str, id: str, fields: list[str])`
- `update_record(sobject: str, id: str, payload: dict)`

Example SOQL builders are implemented for Accounts, Opportunities, Quotes, and Leads.

## Conga Composer Notes

`POST /api/quotes/{id}/generate` returns a Composer URL payload:

```json
{ "url": "https://<sf-domain>/apex/APXTConga4__Conga_Composer?...params..." }
```

TODO placeholders are included for:
- Template ID / Solution Manager ID
- Output type PDF
- Auto-attach/store as Salesforce File related to Quote

`GET /api/quotes/{id}/document` currently returns `404` by design.

TODO in backend explains fetching latest PDF via `ContentDocumentLink` + `ContentVersion.VersionData`.

## Example curl Commands

Set token and base URL:

```bash
export TOKEN="<okta_access_token>"
export API="http://localhost:8000"
```

Health:

```bash
curl "$API/api/health"
```

Accounts list:

```bash
curl -H "Authorization: Bearer $TOKEN" "$API/api/accounts?search=acme&page=1&pageSize=10"
```

Account detail:

```bash
curl -H "Authorization: Bearer $TOKEN" "$API/api/accounts/001A000001"
```

Opportunity update (write role required):

```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"StageName":"Negotiation/Review","CloseDate":"2026-04-15","Amount":275000,"NextStep":"Finalize terms"}' \
  "$API/api/opportunities/006A000001"
```

Quote generate URL (write role required):

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" "$API/api/quotes/0Q0A000001/generate"
```

Quote document download (currently 404 placeholder):

```bash
curl -v -H "Authorization: Bearer $TOKEN" "$API/api/quotes/0Q0A000001/document"
```
