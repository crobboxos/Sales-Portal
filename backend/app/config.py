from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    auth_bypass_enabled: bool = False
    auth_bypass_subject: str = "local-dev-user"
    auth_bypass_name: str = "Local Developer"
    auth_bypass_email: str = "local.dev@sales-portal.test"
    auth_bypass_groups: str = "SalesPortal_Admin,SalesPortal_Sales,SalesPortal_ReadOnly"

    okta_issuer: str = ""
    okta_audience: str = ""

    sf_login_url: str = "https://test.salesforce.com"
    sf_client_id: str = ""
    sf_client_secret: str = ""
    sf_username: str = ""
    sf_private_key_path: str = ""
    sf_api_version: str = "v60.0"
    sf_use_mock_data: bool = True

    conga_base_url: str | None = None
    conga_template_id: str | None = None

    cors_allowed_origins: str = "http://localhost:3000"
    request_timeout_seconds: float = 15.0

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def bypass_groups(self) -> list[str]:
        return [group.strip() for group in self.auth_bypass_groups.split(",") if group.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
