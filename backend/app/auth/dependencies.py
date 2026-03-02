from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.okta import OktaJWTVerifier, OktaVerificationError
from app.config import Settings, get_settings
from app.models.schemas import UserPrincipal


READ_ALLOWED_GROUPS = {"SalesPortal_Admin", "SalesPortal_Sales", "SalesPortal_ReadOnly"}
WRITE_ALLOWED_GROUPS = {"SalesPortal_Admin", "SalesPortal_Sales"}

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _get_verifier() -> OktaJWTVerifier:
    settings = get_settings()
    return OktaJWTVerifier(settings)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> UserPrincipal:
    settings = get_settings()
    if settings.auth_bypass_enabled:
        return UserPrincipal(
            sub=settings.auth_bypass_subject,
            name=settings.auth_bypass_name,
            email=settings.auth_bypass_email,
            groups=settings.bypass_groups,
        )

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token.")

    verifier = _get_verifier()
    try:
        claims = await verifier.verify_token(credentials.credentials)
    except OktaVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    groups = claims.get("groups") or []
    if isinstance(groups, str):
        groups = [groups]

    return UserPrincipal(
        sub=claims.get("sub", ""),
        name=claims.get("name"),
        email=claims.get("email"),
        groups=groups,
    )


def require_groups(allowed_groups: set[str]):
    async def dependency(user: Annotated[UserPrincipal, Depends(get_current_user)]) -> UserPrincipal:
        if not set(user.groups).intersection(allowed_groups):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")
        return user

    return dependency


read_access = require_groups(READ_ALLOWED_GROUPS)
write_access = require_groups(WRITE_ALLOWED_GROUPS)
