from __future__ import annotations

import hmac

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.core.config import settings


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
