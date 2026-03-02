from datetime import datetime, timezone
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from app.auth.dependencies import read_access, write_access
from app.models.schemas import (
    AccountDetail,
    AccountSummary,
    HealthResponse,
    LeadDetail,
    LeadSummary,
    OpportunityCreateRequest,
    OpportunityDetail,
    OpportunityPatchRequest,
    OpportunitySummary,
    PageResponse,
    QuoteDetail,
    QuoteGenerateResponse,
    QuoteSummary,
    UserPrincipal,
)
from app.services.portal_data_service import PortalDataService
from app.services.salesforce_service import SalesforceService
from app.config import get_settings


router = APIRouter(prefix="/api", tags=["portal"])


@lru_cache(maxsize=1)
def _get_portal_data_service() -> PortalDataService:
    settings = get_settings()
    salesforce = SalesforceService(settings)
    return PortalDataService(settings=settings, salesforce=salesforce)


def get_portal_data_service() -> PortalDataService:
    return _get_portal_data_service()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", timestamp=datetime.now(timezone.utc))


@router.get("/accounts", response_model=PageResponse[AccountSummary])
async def list_accounts(
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
    search: str = "",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100, alias="pageSize"),
) -> PageResponse[AccountSummary]:
    return await service.list_accounts(search=search, page=page, page_size=page_size)


@router.get("/accounts/{account_id}", response_model=AccountDetail)
async def get_account(
    account_id: str,
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
) -> AccountDetail:
    return await service.get_account(account_id)


@router.get("/opportunities", response_model=PageResponse[OpportunitySummary])
async def list_opportunities(
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
    search: str = "",
    stage: str = "",
    owner: str = "",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100, alias="pageSize"),
) -> PageResponse[OpportunitySummary]:
    return await service.list_opportunities(
        search=search,
        stage=stage,
        owner=owner,
        page=page,
        page_size=page_size,
    )


@router.post("/opportunities", response_model=OpportunityDetail, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    payload: OpportunityCreateRequest,
    _: Annotated[UserPrincipal, Depends(write_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
) -> OpportunityDetail:
    return await service.create_opportunity(payload)


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityDetail)
async def get_opportunity(
    opportunity_id: str,
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
) -> OpportunityDetail:
    return await service.get_opportunity(opportunity_id)


@router.patch("/opportunities/{opportunity_id}", response_model=OpportunityDetail)
async def patch_opportunity(
    opportunity_id: str,
    updates: OpportunityPatchRequest,
    _: Annotated[UserPrincipal, Depends(write_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
) -> OpportunityDetail:
    return await service.update_opportunity(opportunity_id, updates)


@router.get("/quotes", response_model=PageResponse[QuoteSummary])
async def list_quotes(
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
    search: str = "",
    status_filter: str = Query(default="", alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100, alias="pageSize"),
) -> PageResponse[QuoteSummary]:
    return await service.list_quotes(search=search, status_filter=status_filter, page=page, page_size=page_size)


@router.get("/quotes/{quote_id}", response_model=QuoteDetail)
async def get_quote(
    quote_id: str,
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
) -> QuoteDetail:
    return await service.get_quote(quote_id)


@router.post("/quotes/{quote_id}/generate", response_model=QuoteGenerateResponse)
async def generate_quote(
    quote_id: str,
    _: Annotated[UserPrincipal, Depends(write_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
) -> QuoteGenerateResponse:
    return await service.generate_quote_pdf(quote_id)


@router.get("/quotes/{quote_id}/document")
async def get_quote_document(
    quote_id: str,
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
) -> Response:
    data = await service.get_quote_document(quote_id)
    if data is None:
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    return Response(content=data, media_type="application/pdf")


@router.get("/leads", response_model=PageResponse[LeadSummary])
async def list_leads(
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
    search: str = "",
    status_filter: str = Query(default="", alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100, alias="pageSize"),
) -> PageResponse[LeadSummary]:
    return await service.list_leads(search=search, status_filter=status_filter, page=page, page_size=page_size)


@router.get("/leads/{lead_id}", response_model=LeadDetail)
async def get_lead(
    lead_id: str,
    _: Annotated[UserPrincipal, Depends(read_access)],
    service: Annotated[PortalDataService, Depends(get_portal_data_service)],
) -> LeadDetail:
    return await service.get_lead(lead_id)
