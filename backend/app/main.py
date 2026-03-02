import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import get_settings
from app.services.salesforce_service import SalesforceAPIError, SalesforceAuthError


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()
app = FastAPI(
    title="Sales Management Portal API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SalesforceAuthError)
async def salesforce_auth_error_handler(_: Request, exc: SalesforceAuthError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"detail": str(exc)},
    )


@app.exception_handler(SalesforceAPIError)
async def salesforce_api_error_handler(_: Request, exc: SalesforceAPIError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"detail": str(exc)},
    )


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Starting Sales Management Portal API (mock mode: %s)", settings.sf_use_mock_data)


app.include_router(router)
