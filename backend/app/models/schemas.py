from datetime import date, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, model_validator


T = TypeVar("T")


class PortalBaseModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class PageResponse(PortalBaseModel, Generic[T]):
    items: list[T]
    page: int
    page_size: int = Field(alias="pageSize")
    total: int


class AccountSummary(PortalBaseModel):
    id: str
    name: str
    owner: str
    phone: str | None = None
    industry: str | None = None
    last_modified: datetime = Field(alias="lastModified")


class AccountDetail(AccountSummary):
    website: str | None = None
    billing_city: str | None = Field(default=None, alias="billingCity")
    billing_country: str | None = Field(default=None, alias="billingCountry")


class OpportunitySummary(PortalBaseModel):
    id: str
    name: str
    account: str | None = None
    stage: str = Field(alias="stageName")
    amount: float | None = None
    close_date: date | None = Field(default=None, alias="closeDate")
    owner: str
    last_modified: datetime = Field(alias="lastModified")


class OpportunityDetail(OpportunitySummary):
    next_step: str | None = Field(default=None, alias="nextStep")
    description: str | None = None
    parent_macd_add_url: str | None = Field(default=None, alias="parentMacdAddUrl")


class ParentMacdAddOption(PortalBaseModel):
    id: str
    name: str


class ParentMacdAddProductOption(ParentMacdAddOption):
    product_code: str | None = Field(default=None, alias="productCode")


class ParentMacdAddOptionsResponse(PortalBaseModel):
    opportunity_id: str = Field(alias="opportunityId")
    opportunity_name: str = Field(alias="opportunityName")
    currency_iso_code: str = Field(alias="currencyIsoCode")
    process_url: str | None = Field(default=None, alias="processUrl")
    product_types: list[str] = Field(alias="productTypes")
    products: list[ParentMacdAddProductOption]
    locations: list[ParentMacdAddOption]
    contacts: list[ParentMacdAddOption]


class ParentMacdAddLineRequest(PortalBaseModel):
    site_account_id: str | None = Field(default=None, alias="siteAccountId")
    condition: str
    quantity: float
    unit_price: float = Field(alias="unitPrice")
    sales_cost: float = Field(alias="salesCost")
    delivery_date: date | None = Field(default=None, alias="deliveryDate")
    deliver_to_contact_id: str | None = Field(default=None, alias="deliverToContactId")
    supplier_id: str | None = Field(default=None, alias="supplierId")

    @model_validator(mode="after")
    def validate_line(self) -> "ParentMacdAddLineRequest":
        if self.quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")
        if not self.condition.strip():
            raise ValueError("Condition is required.")
        return self


class ParentMacdAddRequest(PortalBaseModel):
    product_type: str = Field(alias="productType")
    product_id: str = Field(alias="productId")
    lines: list[ParentMacdAddLineRequest]

    @model_validator(mode="after")
    def validate_payload(self) -> "ParentMacdAddRequest":
        if not self.product_type.strip():
            raise ValueError("Product type is required.")
        if not self.product_id.strip():
            raise ValueError("Product is required.")
        if not self.lines:
            raise ValueError("At least one line is required.")
        return self


class ParentMacdAddResult(PortalBaseModel):
    created_line_item_ids: list[str] = Field(alias="createdLineItemIds")
    created_count: int = Field(alias="createdCount")


class OpportunityPatchRequest(PortalBaseModel):
    stage_name: str | None = Field(default=None, alias="StageName")
    close_date: date | None = Field(default=None, alias="CloseDate")
    amount: float | None = Field(default=None, alias="Amount")
    next_step: str | None = Field(default=None, alias="NextStep")

    @model_validator(mode="after")
    def validate_has_content(self) -> "OpportunityPatchRequest":
        if all(value is None for value in [self.stage_name, self.close_date, self.amount, self.next_step]):
            raise ValueError("At least one updatable field is required.")
        return self

    def to_salesforce_payload(self) -> dict[str, str | float]:
        payload: dict[str, str | float] = {}
        if self.stage_name is not None:
            payload["StageName"] = self.stage_name
        if self.close_date is not None:
            payload["CloseDate"] = self.close_date.isoformat()
        if self.amount is not None:
            payload["Amount"] = self.amount
        if self.next_step is not None:
            payload["NextStep"] = self.next_step
        return payload


class OpportunityCreateRequest(PortalBaseModel):
    name: str = Field(alias="Name")
    stage_name: str = Field(alias="StageName")
    close_date: date = Field(alias="CloseDate")
    amount: float | None = Field(default=None, alias="Amount")
    next_step: str | None = Field(default=None, alias="NextStep")
    description: str | None = Field(default=None, alias="Description")

    @model_validator(mode="after")
    def validate_payload(self) -> "OpportunityCreateRequest":
        if not self.name.strip():
            raise ValueError("Name is required.")
        if not self.stage_name.strip():
            raise ValueError("StageName is required.")
        if self.amount is not None and self.amount < 0:
            raise ValueError("Amount must be greater than or equal to zero.")
        return self

    def to_salesforce_payload(self) -> dict[str, str | float]:
        payload: dict[str, str | float] = {
            "Name": self.name.strip(),
            "StageName": self.stage_name.strip(),
            "CloseDate": self.close_date.isoformat(),
        }
        if self.amount is not None:
            payload["Amount"] = self.amount
        if self.next_step and self.next_step.strip():
            payload["NextStep"] = self.next_step.strip()
        if self.description and self.description.strip():
            payload["Description"] = self.description.strip()
        return payload


class QuoteLineItem(PortalBaseModel):
    id: str
    product_name: str = Field(alias="productName")
    quantity: float
    unit_price: float = Field(alias="unitPrice")
    total_price: float = Field(alias="totalPrice")


class QuoteSummary(PortalBaseModel):
    id: str
    quote_number: str = Field(alias="quoteNumber")
    name: str
    account: str | None = None
    opportunity: str | None = None
    status: str
    grand_total: float | None = Field(default=None, alias="grandTotal")
    last_modified: datetime = Field(alias="lastModified")


class QuoteDetail(QuoteSummary):
    expiration_date: date | None = Field(default=None, alias="expirationDate")
    owner: str | None = None
    line_items: list[QuoteLineItem] = Field(default_factory=list, alias="lineItems")


class QuoteGenerateResponse(PortalBaseModel):
    url: str


class LeadSummary(PortalBaseModel):
    id: str
    name: str
    company: str | None = None
    status: str | None = None
    rating: str | None = None
    owner: str | None = None
    created_date: datetime = Field(alias="createdDate")


class LeadDetail(LeadSummary):
    email: str | None = None
    phone: str | None = None
    source: str | None = None


class HealthResponse(PortalBaseModel):
    status: str
    timestamp: datetime


class UserPrincipal(PortalBaseModel):
    sub: str
    name: str | None = None
    email: str | None = None
    groups: list[str] = Field(default_factory=list)
