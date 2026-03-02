from __future__ import annotations

import copy
import logging
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
    ParentMacdAddOption,
    ParentMacdAddOptionsResponse,
    ParentMacdAddProductOption,
    ParentMacdAddRequest,
    ParentMacdAddResult,
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
from app.services.salesforce_service import SalesforceError, SalesforceService


T = TypeVar("T")
UTC = timezone.utc
logger = logging.getLogger(__name__)
PARENT_MACD_ADD_FLOW_API_NAME = "Parent_MACD_Add"
PARENT_MACD_PRODUCT_TYPES = [
    "Parent Product",
    "Accessory",
    "GP Recognition",
    "Rebate",
    "Re-Finance",
    "Settlement",
    "MPS Addition",
]


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
        parent_macd_add_url = await self._build_parent_macd_add_url(opportunity_id)
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
            parent_macd_add_url=parent_macd_add_url,
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

    async def get_parent_macd_add_options(self, opportunity_id: str) -> ParentMacdAddOptionsResponse:
        if self.settings.sf_use_mock_data:
            opportunity = self._find_one(self._opportunities, opportunity_id)
            return ParentMacdAddOptionsResponse(
                opportunityId=opportunity["id"],
                opportunityName=opportunity["name"],
                currencyIsoCode="GBP",
                processUrl=None,
                productTypes=PARENT_MACD_PRODUCT_TYPES,
                products=[
                    ParentMacdAddProductOption(id="01tA00000000001", name="Demo Parent Product", productCode="DEMO-PP"),
                    ParentMacdAddProductOption(id="01tA00000000002", name="Demo Accessory", productCode="DEMO-ACC"),
                ],
                locations=[
                    ParentMacdAddOption(id="a07A00000000001", name="Main Site"),
                    ParentMacdAddOption(id="a07A00000000002", name="Secondary Site"),
                ],
                contacts=[
                    ParentMacdAddOption(id="003A00000000001", name="Alex Manager"),
                    ParentMacdAddOption(id="003A00000000002", name="Casey Operations"),
                ],
            )

        opportunity = await self.salesforce.get_record(
            "Opportunity",
            opportunity_id,
            ["Id", "Name", "AccountId", "CurrencyIsoCode", "Pricebook2Id"],
        )
        account_id = opportunity.get("AccountId")
        currency_iso_code = opportunity.get("CurrencyIsoCode") or "GBP"
        process_url = await self._build_parent_macd_add_url(opportunity_id)
        products = await self._list_parent_macd_products(
            pricebook_id=opportunity.get("Pricebook2Id"),
            currency_iso_code=currency_iso_code,
        )

        locations: list[ParentMacdAddOption] = []
        contacts: list[ParentMacdAddOption] = []
        if account_id:
            escaped_account_id = self._escape_soql_string(account_id)
            location_query = (
                "SELECT Id, Name "
                "FROM Location "
                f"WHERE Location_Account__c = '{escaped_account_id}' "
                "ORDER BY Name ASC "
                "LIMIT 2000"
            )
            location_records = (await self.salesforce.soql_query(location_query)).get("records", [])
            locations = [
                ParentMacdAddOption(id=record["Id"], name=record.get("Name", ""))
                for record in location_records
            ]

            contact_query = (
                "SELECT Id, Name "
                "FROM Contact "
                f"WHERE AccountId = '{escaped_account_id}' "
                "ORDER BY Name ASC "
                "LIMIT 2000"
            )
            contact_records = (await self.salesforce.soql_query(contact_query)).get("records", [])
            contacts = [
                ParentMacdAddOption(id=record["Id"], name=record.get("Name", ""))
                for record in contact_records
            ]

        return ParentMacdAddOptionsResponse(
            opportunityId=opportunity["Id"],
            opportunityName=opportunity.get("Name", ""),
            currencyIsoCode=currency_iso_code,
            processUrl=process_url,
            productTypes=PARENT_MACD_PRODUCT_TYPES,
            products=products,
            locations=locations,
            contacts=contacts,
        )

    async def run_parent_macd_add(self, opportunity_id: str, payload: ParentMacdAddRequest) -> ParentMacdAddResult:
        if payload.product_type not in PARENT_MACD_PRODUCT_TYPES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported product type.")

        if self.settings.sf_use_mock_data:
            _ = self._find_one(self._opportunities, opportunity_id)
            created_line_item_ids = [f"00kA{index + 1:06d}" for index, _line in enumerate(payload.lines)]
            return ParentMacdAddResult(
                createdLineItemIds=created_line_item_ids,
                createdCount=len(created_line_item_ids),
            )

        opportunity = await self.salesforce.get_record(
            "Opportunity",
            opportunity_id,
            ["Id", "Pricebook2Id", "CurrencyIsoCode"],
        )
        pricebook_id = opportunity.get("Pricebook2Id")
        if not pricebook_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Opportunity requires a pricebook before running Parent MACD Add.",
            )
        pricebook_entry_id = await self._resolve_pricebook_entry_id(
            product_id=payload.product_id,
            pricebook_id=pricebook_id,
            currency_iso_code=opportunity.get("CurrencyIsoCode"),
        )
        if not pricebook_entry_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active pricebook entry found for the selected product.",
            )

        next_group = await self._get_next_opportunity_product_group(opportunity_id)
        created_line_item_ids: list[str] = []
        for index, line in enumerate(payload.lines):
            line_payload: dict[str, str | float | bool] = {
                "OpportunityId": opportunity_id,
                "PricebookEntryId": pricebook_entry_id,
                "Quantity": line.quantity,
                "UnitPrice": line.unit_price,
                "Product_Condition__c": line.condition.strip(),
                "Sales_Cost__c": line.sales_cost,
                "Parent_Product_Process__c": True,
                "Remaining_to_Rollout__c": line.quantity,
                "Opportunity_Product_Group__c": float(next_group + index),
            }
            if line.site_account_id:
                line_payload["Site_Account__c"] = line.site_account_id
            if line.deliver_to_contact_id:
                line_payload["Deliver_To__c"] = line.deliver_to_contact_id
            if line.delivery_date:
                line_payload["Delivery_Date__c"] = line.delivery_date.isoformat()
            if line.supplier_id:
                line_payload["Supplier__c"] = line.supplier_id

            created_line_item_ids.append(await self.salesforce.create_record("OpportunityLineItem", line_payload))

        return ParentMacdAddResult(
            createdLineItemIds=created_line_item_ids,
            createdCount=len(created_line_item_ids),
        )

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

    async def _list_parent_macd_products(
        self,
        pricebook_id: str | None,
        currency_iso_code: str | None,
    ) -> list[ParentMacdAddProductOption]:
        filters = ["IsActive = true", "Product2.IsActive = true"]
        if pricebook_id:
            filters.append(f"Pricebook2Id = '{self._escape_soql_string(pricebook_id)}'")
        if currency_iso_code:
            filters.append(f"CurrencyIsoCode = '{self._escape_soql_string(currency_iso_code)}'")

        soql = (
            "SELECT Id, Product2Id, Product2.Name, Product2.ProductCode "
            "FROM PricebookEntry "
            f"WHERE {' AND '.join(filters)} "
            "ORDER BY Product2.Name ASC "
            "LIMIT 2000"
        )
        records = (await self.salesforce.soql_query(soql)).get("records", [])
        deduplicated: dict[str, ParentMacdAddProductOption] = {}
        for record in records:
            product_id = record.get("Product2Id")
            product = record.get("Product2") or {}
            if not isinstance(product_id, str) or product_id in deduplicated:
                continue
            deduplicated[product_id] = ParentMacdAddProductOption(
                id=product_id,
                name=product.get("Name", ""),
                productCode=product.get("ProductCode"),
            )

        if deduplicated:
            return list(deduplicated.values())

        fallback_soql = (
            "SELECT Id, Name, ProductCode "
            "FROM Product2 "
            "WHERE IsActive = true "
            "ORDER BY Name ASC "
            "LIMIT 200"
        )
        fallback_records = (await self.salesforce.soql_query(fallback_soql)).get("records", [])
        return [
            ParentMacdAddProductOption(
                id=record["Id"],
                name=record.get("Name", ""),
                productCode=record.get("ProductCode"),
            )
            for record in fallback_records
        ]

    async def _resolve_pricebook_entry_id(
        self,
        product_id: str,
        pricebook_id: str | None,
        currency_iso_code: str | None,
    ) -> str | None:
        filters = [f"Product2Id = '{self._escape_soql_string(product_id)}'", "IsActive = true"]
        if pricebook_id:
            filters.append(f"Pricebook2Id = '{self._escape_soql_string(pricebook_id)}'")
        if currency_iso_code:
            filters.append(f"CurrencyIsoCode = '{self._escape_soql_string(currency_iso_code)}'")

        soql = (
            "SELECT Id "
            "FROM PricebookEntry "
            f"WHERE {' AND '.join(filters)} "
            "ORDER BY IsActive DESC "
            "LIMIT 1"
        )
        records = (await self.salesforce.soql_query(soql)).get("records", [])
        if records:
            return records[0].get("Id")
        return None

    async def _get_next_opportunity_product_group(self, opportunity_id: str) -> int:
        escaped_opportunity_id = self._escape_soql_string(opportunity_id)
        queries = [
            (
                "SELECT Opportunity_Product_Group__c "
                "FROM OpportunityLineItem "
                f"WHERE OpportunityId = '{escaped_opportunity_id}' "
                "AND Opportunity_Product_Group__c != null "
                "ORDER BY Opportunity_Product_Group__c DESC "
                "LIMIT 1",
                "Opportunity_Product_Group__c",
            ),
            (
                "SELECT Group__c "
                "FROM OpportunityLineItem "
                f"WHERE OpportunityId = '{escaped_opportunity_id}' "
                "AND Group__c != null "
                "ORDER BY Group__c DESC "
                "LIMIT 1",
                "Group__c",
            ),
        ]
        for soql, field_name in queries:
            try:
                records = (await self.salesforce.soql_query(soql)).get("records", [])
            except SalesforceError:
                continue
            if not records:
                continue
            group_value = records[0].get(field_name)
            if isinstance(group_value, (int, float)):
                return int(group_value) + 1
        return 1

    async def _build_parent_macd_add_url(self, opportunity_id: str) -> str | None:
        if self.settings.sf_use_mock_data:
            return None

        try:
            return await self.salesforce.build_flow_launch_url(
                PARENT_MACD_ADD_FLOW_API_NAME,
                {"recordId": opportunity_id},
            )
        except SalesforceError as error:
            logger.warning(
                "Failed to build Parent MACD Add flow URL for opportunity %s: %s",
                opportunity_id,
                error,
            )
            return None

    @staticmethod
    def _escape_soql_string(value: str) -> str:
        return value.replace("\\", "\\\\").replace("'", "\\'")

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
