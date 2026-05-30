from __future__ import annotations

import hmac
import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.core.config import settings


logger = logging.getLogger(__name__)

security = HTTPBasic()


def verify_basic_auth(credentials: HTTPBasicCredentials = Depends(security)) -> None:
    """Verify Basic Auth credentials for JSON-RPC endpoint.

    Username and password are taken from settings:
    - RPC_USERNAME
    - RPC_PASSWORD

    Both comparisons use hmac.compare_digest to prevent timing-based
    credential enumeration attacks.
    """

    expected_username = settings.RPC_USERNAME
    # RPC_PASSWORD is stored as SecretStr; unwrap before comparison.
    try:
        expected_password = settings.RPC_PASSWORD.get_secret_value()
    except AttributeError:
        expected_password = str(settings.RPC_PASSWORD)

    username_ok = hmac.compare_digest(
        credentials.username.encode("utf-8"),
        expected_username.encode("utf-8"),
    )
    password_ok = hmac.compare_digest(
        credentials.password.encode("utf-8"),
        expected_password.encode("utf-8"),
    )
    if not (username_ok and password_ok):
        # RFC-compliant 401 with WWW-Authenticate header
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )


def _rpc_client_ip(request: Request) -> str:
    """Resolve the client IP for the RPC allowlist, honoring TRUST_PROXY."""
    if settings.TRUST_PROXY:
        xri = request.headers.get("x-real-ip")
        if xri:
            return xri.split(",")[0].strip()
    return request.client.host if request.client else ""


def verify_rpc_ip(request: Request) -> None:
    """Optionally restrict /api/rpc to a configured set of source IPs.

    Controlled by settings.RPC_ALLOWED_IPS (comma-separated). When empty the
    check is disabled so existing deployments keep working until the acquirer's
    IPs are configured. This is defense-in-depth layered on top of Basic Auth.
    """
    allow = [ip.strip() for ip in (settings.RPC_ALLOWED_IPS or "").split(",") if ip.strip()]
    if not allow:
        return
    client_ip = _rpc_client_ip(request)
    if client_ip not in allow:
        logger.warning("Rejected /api/rpc call from disallowed IP: %s", client_ip)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
