from datetime import datetime, timedelta, timezone
import jwt
from jwt.exceptions import InvalidTokenError
from app.core.config import settings
from typing import Optional, Dict, Any

# Use settings from config.py instead of os.getenv to avoid caching issues
ALGORITHM = settings.ALGORITHM
# SECRET_KEY is stored as SecretStr; unwrap it for cryptographic operations.
SECRET_KEY = settings.SECRET_KEY.get_secret_value()
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS
SESSION_MAX_DAYS = settings.SESSION_MAX_DAYS
SESSION_MAX_HOURS = settings.SESSION_MAX_HOURS

def _calc_session_exp(now: datetime, existing_session_exp: datetime | None = None) -> datetime | None:
    """Return absolute session expiration or None if disabled.

    If SESSION_MAX_DAYS == 0 => disabled.
    existing_session_exp lets us keep the original absolute expiry when rotating tokens.
    """
    if SESSION_MAX_HOURS > 0:
        if existing_session_exp:
            return existing_session_exp
        return now + timedelta(hours=SESSION_MAX_HOURS)
    if SESSION_MAX_DAYS <= 0:
        return None
    if existing_session_exp:
        return existing_session_exp
    return now + timedelta(days=SESSION_MAX_DAYS)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, session_exp: datetime | None = None, token_version: int = 0) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access", "token_version": token_version})
    if session_exp is not None:
        to_encode["sess_exp"] = int(session_exp.timestamp())
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None, session_exp: datetime | None = None, token_version: int = 0) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh", "token_version": token_version})
    if session_exp is not None:
        to_encode["sess_exp"] = int(session_exp.timestamp())
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT access token.

    PyJWT rejects the 'none' algorithm by default when algorithms is an
    explicit list, preventing algorithm-confusion attacks.

    Returns the full payload dict including 'token_version' (int, default 0).
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        # Normalise token_version so callers can always rely on it being an int
        payload.setdefault("token_version", 0)
        return payload
    except InvalidTokenError:
        return None

def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT refresh token.

    Returns the full payload dict including 'token_version' (int, default 0).
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        # Normalise token_version so callers can always rely on it being an int
        payload.setdefault("token_version", 0)
        return payload
    except InvalidTokenError:
        return None
