from __future__ import annotations

import copy
from collections.abc import Iterable
from datetime import datetime, timezone
from typing import TypeVar

from fastapi import HTTPException, status

from app.config import Settings
from app.models.schemas import (
    AccountDetail,
    AccountSummary,
    LeadDetail,
    LeadSummary,
    OpportunityCreateRequest,
    OpportunityDetail,
    OpportunityPatchRequest,
    OpportunitySummary,
    PageResponse,
    QuoteDetail,
    QuoteGenerateResponse,
    QuoteLineItem,
    QuoteSummary,
)
from app.services.mock_data import (
    MOCK_ACCOUNTS,
    MOCK_LEADS,
    MOCK_OPPORTUNITIES,
    MOCK_QUOTE_LINE_ITEMS,
    MOCK_QUOTES,
)
from app.services.salesforce_service import SalesforceService


T = TypeVar("T")
UTC = timezone.utc


class PortalDataService:
    def __init__(self, settings: Settings, salesforce: SalesforceService) -> None:
        self.settings = settings
        self.salesforce = salesforce
        self._accounts = copy.deepcopy(MOCK_ACCOUNTS)
        self._opportunities = copy.deepcopy(MOCK_OPPORTUNITIES)
        self._quotes = copy.deepcopy(MOCK_QUOTES)
        self._quote_line_items = copy.deepcopy(MOCK_QUOTE_LINE_ITEMS)
        self._leads = copy.deepcopy(MOCK_LEADS)

    async def list_accounts(self, search: str, page: int, page_size: int) -> PageResponse[AccountSummary]:
        if self.settings.sf_use_mock_data:
            filtered = [item for item in self._accounts if search.lower() in item["name"].lower()]
            filtered.sort(key=lambda item: item["lastModified"], reverse=True)
            window, total = self._paginate(filtered, page, page_size)
            return PageResponse[AccountSummary](
                items=[AccountSummary.model_validate(item) for item in window],
                page=page,
                pageSize=page_size,
                total=total,
            )

        offset = (page - 1) * page_size
        soql = SalesforceService.build_accounts_soql(search=search, page_size=page_size, offset=offset)
        data = await self.salesforce.soql_query(soql)
        records = data.get("records", [])
        return PageResponse[AccountSummary](
            items=[
                AccountSummary(
                    id=record["Id"],
                    name=record.get("Name"),
                    owner=(record.get("Owner") or {}).get("Name", ""),
                    phone=record.get("Phone"),
                    industry=record.get("Industry"),
                    lastModified=record.get("LastModifiedDate"),
                )
                for record in records
            ],
            page=page,
            pageSize=page_size,
            total=data.get("totalSize", len(records)),
        )

    async def get_account(self, account_id: str) -> AccountDetail:
        if self.settings.sf_use_mock_data:
            account = self._find_one(self._accounts, account_id)
            return AccountDetail.model_validate(account)

        record = await self.salesforce.get_record(
            "Account",
            account_id,
            ["Id", "Name", "Owner.Name", "Phone", "Industry", "Website", "BillingCity", "BillingCountry", "LastModifiedDate"],
        )
        return AccountDetail(
            id=record["Id"],
            name=record.get("Name"),
            owner=(record.get("Owner") or {}).get("Name", ""),
            phone=record.get("Phone"),
            industry=record.get("Industry"),
            website=record.get("Website"),
            billingCity=record.get("BillingCity"),
            billingCountry=record.get("BillingCountry"),
            lastModified=record.get("LastModifiedDate"),
        )

    async def list_opportunities(
        self,
        search: str,
        stage: str,
        owner: str,
        page: int,
        page_size: int,
    ) -> PageResponse[OpportunitySummary]:
        if self.settings.sf_use_mock_data:
            filtered = [
                item
                for item in self._opportunities
                if search.lower() in item["name"].lower()
                and (not stage or item["stageName"].lower() == stage.lower())
                and (not owner or owner.lower() in item["owner"].lower())
            ]
            filtered.sort(key=lambda item: item["lastModified"], reverse=True)
            window, total = self._paginate(filtered, page, page_size)
            return PageResponse[OpportunitySummary](
                items=[OpportunitySummary.model_validate(item) for item in window],
                page=page,
                pageSize=page_size,
                total=total,
            )

        offset = (page - 1) * page_size
        soql = SalesforceService.build_opportunities_soql(
            search=search,
            stage=stage,
            owner=owner,
            page_size=page_size,
            offset=offset,
        )
        data = await self.salesforce.soql_query(soql)
        records = data.get("records", [])
        return PageResponse[OpportunitySummary](
            items=[
                OpportunitySummary(
                    id=record["Id"],
                    name=record.get("Name"),
                    account=(record.get("Account") or {}).get("Name"),
                    stageName=record.get("StageName", ""),
                    amount=record.get("Amount"),
                    closeDate=record.get("CloseDate"),
                    owner=(record.get("Owner") or {}).get("Name", ""),
                    lastModified=record.get("LastModifiedDate"),
                )
                for record in records
            ],
            page=page,
            pageSize=page_size,
            total=data.get("totalSize", len(records)),
        )

    async def get_opportunity(self, opportunity_id: str) -> OpportunityDetail:
        if self.settings.sf_use_mock_data:
            opportunity = self._find_one(self._opportunities, opportunity_id)
            return OpportunityDetail.model_validate(opportunity)

        record = await self.salesforce.get_record(
            "Opportunity",
            opportunity_id,
            ["Id", "Name", "StageName", "Amount", "CloseDate", "Account.Name", "Owner.Name", "LastModifiedDate", "NextStep"],
        )
        return OpportunityDetail(
            id=record["Id"],
            name=record.get("Name"),
            account=(record.get("Account") or {}).get("Name"),
            stageName=record.get("StageName", ""),
            amount=record.get("Amount"),
            closeDate=record.get("CloseDate"),
            owner=(record.get("Owner") or {}).get("Name", ""),
            nextStep=record.get("NextStep"),
            lastModified=record.get("LastModifiedDate"),
        )

    async def create_opportunity(self, payload: OpportunityCreateRequest) -> OpportunityDetail:
        if self.settings.sf_use_mock_data:
            now = datetime.now(UTC)
            opportunity = {
                "id": self._next_mock_opportunity_id(),
                "name": payload.name.strip(),
                "account": None,
                "stageName": payload.stage_name.strip(),
                "amount": payload.amount,
                "closeDate": payload.close_date,
                "owner": "Sales Portal User",
                "nextStep": payload.next_step.strip() if payload.next_step and payload.next_step.strip() else None,
                "description": payload.description.strip() if payload.description and payload.description.strip() else None,
                "lastModified": now,
            }
            self._opportunities.insert(0, opportunity)
            return OpportunityDetail.model_validate(opportunity)

        record_id = await self.salesforce.create_record("Opportunity", payload.to_salesforce_payload())
        return await self.get_opportunity(record_id)

    async def update_opportunity(self, opportunity_id: str, updates: OpportunityPatchRequest) -> OpportunityDetail:
        if self.settings.sf_use_mock_data:
            opportunity = self._find_one(self._opportunities, opportunity_id)
            payload = updates.to_salesforce_payload()
            mapping = {
                "StageName": "stageName",
                "CloseDate": "closeDate",
                "Amount": "amount",
                "NextStep": "nextStep",
            }
            for sf_field, value in payload.items():
                local_field = mapping[sf_field]
                if sf_field == "CloseDate" and isinstance(value, str):
                    opportunity[local_field] = datetime.fromisoformat(value).date()
                else:
                    opportunity[local_field] = value
            opportunity["lastModified"] = datetime.now(UTC)
            return OpportunityDetail.model_validate(opportunity)

        payload = updates.to_salesforce_payload()
        await self.salesforce.update_record("Opportunity", opportunity_id, payload)
        return await self.get_opportunity(opportunity_id)

    async def list_quotes(self, search: str, status_filter: str, page: int, page_size: int) -> PageResponse[QuoteSummary]:
        if self.settings.sf_use_mock_data:
            filtered = [
                item
                for item in self._quotes
                if search.lower() in item["name"].lower()
                and (not status_filter or item["status"].lower() == status_filter.lower())
            ]
            filtered.sort(key=lambda item: item["lastModified"], reverse=True)
            window, total = self._paginate(filtered, page, page_size)
            return PageResponse[QuoteSummary](
                items=[QuoteSummary.model_validate(item) for item in window],
                page=page,
                pageSize=page_size,
                total=total,
            )

        offset = (page - 1) * page_size
        soql = SalesforceService.build_quotes_soql(
            search=search,
            status=status_filter,
            page_size=page_size,
            offset=offset,
        )
        data = await self.salesforce.soql_query(soql)
        records = data.get("records", [])
        return PageResponse[QuoteSummary](
            items=[
                QuoteSummary(
                    id=record["Id"],
                    quoteNumber=record.get("QuoteNumber", ""),
                    name=record.get("Name"),
                    account=(record.get("Account") or {}).get("Name"),
                    opportunity=(record.get("Opportunity") or {}).get("Name"),
                    status=record.get("Status", ""),
                    grandTotal=record.get("GrandTotal"),
                    lastModified=record.get("LastModifiedDate"),
                )
                for record in records
            ],
            page=page,
            pageSize=page_size,
            total=data.get("totalSize", len(records)),
        )

    async def get_quote(self, quote_id: str) -> QuoteDetail:
        if self.settings.sf_use_mock_data:
            quote = self._find_one(self._quotes, quote_id)
            quote["lineItems"] = self._quote_line_items.get(quote_id, [])
            return QuoteDetail.model_validate(quote)

        record = await self.salesforce.get_record(
            "Quote",
            quote_id,
            ["Id", "Name", "QuoteNumber", "Status", "GrandTotal", "ExpirationDate", "Account.Name", "Opportunity.Name", "Owner.Name", "LastModifiedDate"],
        )
        return QuoteDetail(
            id=record["Id"],
            quoteNumber=record.get("QuoteNumber", ""),
            name=record.get("Name"),
            account=(record.get("Account") or {}).get("Name"),
            opportunity=(record.get("Opportunity") or {}).get("Name"),
            status=record.get("Status", ""),
            grandTotal=record.get("GrandTotal"),
            expirationDate=record.get("ExpirationDate"),
            owner=(record.get("Owner") or {}).get("Name"),
            lineItems=[],
            lastModified=record.get("LastModifiedDate"),
        )

    async def generate_quote_pdf(self, quote_id: str) -> QuoteGenerateResponse:
        if self.settings.sf_use_mock_data:
            base_url = self.settings.conga_base_url or "https://test.salesforce.com"
            template_id = self.settings.conga_template_id or "TODO_TEMPLATE_ID"
            url = (
                f"{base_url.rstrip('/')}/apex/APXTConga4__Conga_Composer"
                f"?id={quote_id}&TemplateId={template_id}&OFN=Quote_{quote_id}&DS7=1&FP0=1"
            )
            return QuoteGenerateResponse(url=url)

        url = await self.salesforce.build_conga_url(quote_id)
        return QuoteGenerateResponse(url=url)

    async def get_quote_document(self, quote_id: str) -> bytes | None:
        _ = quote_id
        # TODO: Query ContentDocumentLink where LinkedEntityId = quote_id, select latest
        # ContentVersion (VersionData) and stream bytes as application/pdf.
        return None

    async def list_leads(self, search: str, status_filter: str, page: int, page_size: int) -> PageResponse[LeadSummary]:
        if self.settings.sf_use_mock_data:
            filtered = [
                item
                for item in self._leads
                if search.lower() in item["name"].lower()
                and (not status_filter or (item["status"] or "").lower() == status_filter.lower())
            ]
            filtered.sort(key=lambda item: item["createdDate"], reverse=True)
            window, total = self._paginate(filtered, page, page_size)
            return PageResponse[LeadSummary](
                items=[LeadSummary.model_validate(item) for item in window],
                page=page,
                pageSize=page_size,
                total=total,
            )

        offset = (page - 1) * page_size
        soql = SalesforceService.build_leads_soql(
            search=search,
            status=status_filter,
            page_size=page_size,
            offset=offset,
        )
        data = await self.salesforce.soql_query(soql)
        records = data.get("records", [])
        return PageResponse[LeadSummary](
            items=[
                LeadSummary(
                    id=record["Id"],
                    name=record.get("Name", ""),
                    company=record.get("Company"),
                    status=record.get("Status"),
                    rating=record.get("Rating"),
                    owner=(record.get("Owner") or {}).get("Name"),
                    createdDate=record.get("CreatedDate"),
                )
                for record in records
            ],
            page=page,
            pageSize=page_size,
            total=data.get("totalSize", len(records)),
        )

    async def get_lead(self, lead_id: str) -> LeadDetail:
        if self.settings.sf_use_mock_data:
            lead = self._find_one(self._leads, lead_id)
            return LeadDetail.model_validate(lead)

        record = await self.salesforce.get_record(
            "Lead",
            lead_id,
            ["Id", "Name", "Company", "Status", "Rating", "Owner.Name", "CreatedDate", "Email", "Phone", "LeadSource"],
        )
        return LeadDetail(
            id=record["Id"],
            name=record.get("Name", ""),
            company=record.get("Company"),
            status=record.get("Status"),
            rating=record.get("Rating"),
            owner=(record.get("Owner") or {}).get("Name"),
            createdDate=record.get("CreatedDate"),
            email=record.get("Email"),
            phone=record.get("Phone"),
            source=record.get("LeadSource"),
        )

    @staticmethod
    def _paginate(items: list[T], page: int, page_size: int) -> tuple[list[T], int]:
        start = (page - 1) * page_size
        stop = start + page_size
        return items[start:stop], len(items)

    def _next_mock_opportunity_id(self) -> str:
        prefix = "006A"
        next_number = 1
        for item in self._opportunities:
            record_id = item.get("id", "")
            if not isinstance(record_id, str) or not record_id.startswith(prefix):
                continue
            suffix = record_id[len(prefix) :]
            if suffix.isdigit():
                next_number = max(next_number, int(suffix) + 1)
        return f"{prefix}{next_number:06d}"

    @staticmethod
    def _find_one(items: Iterable[dict], record_id: str) -> dict:
        for item in items:
            if item["id"] == record_id:
                return item
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")
