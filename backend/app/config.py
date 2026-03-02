from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    okta_issuer: str = ""
    okta_audience: str = ""

    sf_login_url: str = "https://test.salesforce.com"
    sf_client_id: str = ""
    sf_username: str = ""
    sf_private_key_path: str = ""
    sf_api_version: str = "v60.0"
    sf_use_mock_data: bool = True

    conga_base_url: str | None = None
    conga_template_id: str | None = None

    cors_allowed_origins: str = "http://localhost:3000"
    request_timeout_seconds: float = 15.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
