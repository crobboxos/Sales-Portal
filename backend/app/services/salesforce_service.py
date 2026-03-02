import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

import httpx
import jwt

from app.config import Settings


logger = logging.getLogger(__name__)
UTC = timezone.utc


class SalesforceError(Exception):
    """Base exception for Salesforce integration errors."""


class SalesforceAuthError(SalesforceError):
    """Raised when token acquisition fails."""


class SalesforceAPIError(SalesforceError):
    """Raised when Salesforce API calls fail."""


@dataclass
class SalesforceToken:
    access_token: str
    instance_url: str
    expires_at: datetime

    def is_expired(self) -> bool:
        return datetime.now(UTC) >= self.expires_at


class SalesforceService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._cached_token: SalesforceToken | None = None

    async def get_access_token(self) -> SalesforceToken:
        if self._cached_token and not self._cached_token.is_expired():
            return self._cached_token

        assertion = self._build_jwt_assertion()
        token_url = f"{self.settings.sf_login_url.rstrip('/')}/services/oauth2/token"
        payload = {
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
        }

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(token_url, data=payload)

        if response.status_code != 200:
            logger.error("Salesforce token request failed (%s): %s", response.status_code, response.text)
            raise SalesforceAuthError("Failed to obtain Salesforce access token.")

        body = response.json()
        issued_at_ms = int(body.get("issued_at", int(time.time() * 1000)))
        # Salesforce token response does not include explicit expiry; keep cache conservative.
        expires_at = datetime.fromtimestamp(issued_at_ms / 1000, tz=UTC) + timedelta(minutes=10)

        token = SalesforceToken(
            access_token=body["access_token"],
            instance_url=body["instance_url"],
            expires_at=expires_at,
        )
        self._cached_token = token
        return token

    async def soql_query(self, soql: str) -> dict:
        token = await self.get_access_token()
        endpoint = f"{token.instance_url}/services/data/{self.settings.sf_api_version}/query"
        response = await self._request("GET", endpoint, token.access_token, params={"q": soql})
        return response.json()

    async def get_record(self, sobject: str, record_id: str, fields: list[str]) -> dict:
        token = await self.get_access_token()
        endpoint = f"{token.instance_url}/services/data/{self.settings.sf_api_version}/sobjects/{sobject}/{record_id}"
        params = {"fields": ",".join(fields)} if fields else None
        response = await self._request("GET", endpoint, token.access_token, params=params)
        return response.json()

    async def update_record(self, sobject: str, record_id: str, payload: dict) -> None:
        token = await self.get_access_token()
        endpoint = f"{token.instance_url}/services/data/{self.settings.sf_api_version}/sobjects/{sobject}/{record_id}"
        await self._request("PATCH", endpoint, token.access_token, json_body=payload)

    @staticmethod
    def build_accounts_soql(search: str, page_size: int, offset: int) -> str:
        sanitized_search = search.replace("'", "\\'")
        return (
            "SELECT Id, Name, Owner.Name, Phone, Industry, LastModifiedDate "
            "FROM Account "
            f"WHERE Name LIKE '%{sanitized_search}%' "
            "ORDER BY LastModifiedDate DESC "
            f"LIMIT {page_size} OFFSET {offset}"
        )

    @staticmethod
    def build_opportunities_soql(search: str, stage: str, owner: str, page_size: int, offset: int) -> str:
        filters = ["Name LIKE '%{}%'".format(search.replace("'", "\\'"))]
        if stage:
            filters.append("StageName = '{}'".format(stage.replace("'", "\\'")))
        if owner:
            filters.append("Owner.Name LIKE '%{}%'".format(owner.replace("'", "\\'")))
        where_clause = " AND ".join(filters)
        return (
            "SELECT Id, Name, StageName, Amount, CloseDate, Account.Name, Owner.Name, LastModifiedDate "
            "FROM Opportunity "
            f"WHERE {where_clause} "
            "ORDER BY LastModifiedDate DESC "
            f"LIMIT {page_size} OFFSET {offset}"
        )

    @staticmethod
    def build_quotes_soql(search: str, status: str, page_size: int, offset: int) -> str:
        filters = ["Name LIKE '%{}%'".format(search.replace("'", "\\'"))]
        if status:
            filters.append("Status = '{}'".format(status.replace("'", "\\'")))
        where_clause = " AND ".join(filters)
        return (
            "SELECT Id, Name, QuoteNumber, Status, GrandTotal, LastModifiedDate, Account.Name, Opportunity.Name "
            "FROM Quote "
            f"WHERE {where_clause} "
            "ORDER BY LastModifiedDate DESC "
            f"LIMIT {page_size} OFFSET {offset}"
        )

    @staticmethod
    def build_leads_soql(search: str, status: str, page_size: int, offset: int) -> str:
        filters = ["Name LIKE '%{}%'".format(search.replace("'", "\\'"))]
        if status:
            filters.append("Status = '{}'".format(status.replace("'", "\\'")))
        where_clause = " AND ".join(filters)
        return (
            "SELECT Id, Name, Company, Status, Rating, Owner.Name, CreatedDate "
            "FROM Lead "
            f"WHERE {where_clause} "
            "ORDER BY CreatedDate DESC "
            f"LIMIT {page_size} OFFSET {offset}"
        )

    async def build_conga_url(self, quote_id: str) -> str:
        token = await self.get_access_token()
        base_url = self.settings.conga_base_url or token.instance_url
        template_id = self.settings.conga_template_id or "TODO_TEMPLATE_ID"

        params = {
            "id": quote_id,
            "TemplateId": template_id,
            # TODO: Use final Conga template parameterization strategy
            # - TemplateId or Solution Manager ID
            # - Output type PDF
            # - Attach/Store resulting file against Quote as Salesforce File
            "OFN": "Quote_{Id}",
            "DS7": "1",
            "FP0": "1",
        }
        return f"{base_url.rstrip('/')}/apex/APXTConga4__Conga_Composer?{urlencode(params)}"

    def _build_jwt_assertion(self) -> str:
        private_key_path = Path(self.settings.sf_private_key_path)
        if not private_key_path.exists():
            raise SalesforceAuthError(f"Salesforce private key not found at {private_key_path}.")

        private_key = private_key_path.read_text(encoding="utf-8")
        claims = {
            "iss": self.settings.sf_client_id,
            "sub": self.settings.sf_username,
            "aud": self.settings.sf_login_url.rstrip("/"),
            "exp": int(time.time()) + 180,
        }
        return jwt.encode(claims, private_key, algorithm="RS256")

    async def _request(
        self,
        method: str,
        url: str,
        access_token: str,
        params: dict | None = None,
        json_body: dict | None = None,
    ) -> httpx.Response:
        headers = {"Authorization": f"Bearer {access_token}"}
        if json_body is not None:
            headers["Content-Type"] = "application/json"

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.request(method, url, headers=headers, params=params, json=json_body)

        if response.status_code >= 400:
            detail = response.text
            logger.error("Salesforce API error (%s): %s", response.status_code, detail)
            raise SalesforceAPIError(f"Salesforce API request failed: {detail}")

        return response
