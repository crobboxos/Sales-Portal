import json
import logging
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from jwt import InvalidTokenError
from jwt.algorithms import RSAAlgorithm

from app.config import Settings


logger = logging.getLogger(__name__)
UTC = timezone.utc


class OktaVerificationError(Exception):
    """Raised when an Okta token cannot be verified."""


class OktaJWTVerifier:
    def __init__(self, settings: Settings) -> None:
        self._issuer = settings.okta_issuer.rstrip("/")
        self._audience = settings.okta_audience
        self._timeout = settings.request_timeout_seconds
        self._cached_jwks: dict | None = None
        self._jwks_expires_at: datetime = datetime.min.replace(tzinfo=UTC)

    async def verify_token(self, token: str) -> dict:
        if not token:
            raise OktaVerificationError("Missing bearer token.")
        if not self._issuer:
            raise OktaVerificationError("OKTA_ISSUER is not configured.")

        key = await self._resolve_signing_key(token)
        try:
            options = {"verify_aud": bool(self._audience)}
            claims = jwt.decode(
                token,
                key=key,
                algorithms=["RS256"],
                issuer=self._issuer,
                audience=self._audience or None,
                options=options,
            )
        except InvalidTokenError as exc:
            raise OktaVerificationError("Invalid Okta access token.") from exc

        return claims

    async def _resolve_signing_key(self, token: str):
        try:
            header = jwt.get_unverified_header(token)
        except InvalidTokenError as exc:
            raise OktaVerificationError("Malformed JWT header.") from exc

        kid = header.get("kid")
        if not kid:
            raise OktaVerificationError("JWT kid header is required.")

        jwks = await self._get_jwks(force_refresh=False)
        jwk = self._find_key(jwks, kid)
        if jwk is None:
            jwks = await self._get_jwks(force_refresh=True)
            jwk = self._find_key(jwks, kid)
        if jwk is None:
            raise OktaVerificationError("No matching signing key for token.")
        return RSAAlgorithm.from_jwk(json.dumps(jwk))

    async def _get_jwks(self, force_refresh: bool) -> dict:
        now = datetime.now(UTC)
        if not force_refresh and self._cached_jwks and now < self._jwks_expires_at:
            return self._cached_jwks

        url = f"{self._issuer}/v1/keys"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(url)
        if response.status_code != 200:
            logger.error("Failed to fetch Okta JWKS (%s): %s", response.status_code, response.text)
            raise OktaVerificationError("Unable to fetch Okta JWKS.")

        self._cached_jwks = response.json()
        self._jwks_expires_at = now + timedelta(hours=1)
        return self._cached_jwks

    @staticmethod
    def _find_key(jwks: dict, kid: str) -> dict | None:
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                return key
        return None
