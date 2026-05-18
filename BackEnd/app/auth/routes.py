from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
import time
import logging
from collections import defaultdict, deque
from datetime import datetime
from typing import Optional

from app.db.database import get_db
from app.auth.jwt import create_access_token, create_refresh_token, decode_refresh_token, _calc_session_exp
from app.auth.password import verify_password
from app.crud.user import create_user, get_user_by_name, get_user_by_phone_number, get_user
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.core.config import settings


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set HttpOnly cookies for access and refresh tokens.

    Tokens are never exposed in the response body — the browser stores
    them in HttpOnly cookies that JavaScript cannot read, eliminating
    the most common XSS-based token theft vector.
    """
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=settings.COOKIE_DOMAIN or None,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
        domain=settings.COOKIE_DOMAIN or None,
    )


def _clear_auth_cookies(response: Response) -> None:
    for name in ("access_token", "refresh_token"):
        response.delete_cookie(
            key=name,
            path="/",
            secure=settings.COOKIE_SECURE,
            httponly=True,
            samesite=settings.COOKIE_SAMESITE,
            domain=settings.COOKIE_DOMAIN or None,
        )


logger = logging.getLogger(__name__)

auth_router = APIRouter()

# In-memory rate limit storage: key -> deque[timestamps].
# NOTE: This state is per-process and resets on restart. It is NOT shared
# across multiple workers. For multi-worker deployments, replace with a
# Redis-backed counter (e.g. using aioredis INCR/EXPIRE).
_login_attempts = defaultdict(deque)

def _rate_limit_key(name: str, client_ip: str) -> str:
    return f"{client_ip}:{name}" if name else client_ip

_MAX_RATE_LIMIT_KEYS = 5_000

def check_login_rate_limit(name: str, client_ip: str):
    now = time.time()
    window = settings.LOGIN_RATE_WINDOW_SEC
    limit = settings.LOGIN_RATE_LIMIT
    key = _rate_limit_key(name, client_ip)
    dq = _login_attempts[key]
    while dq and now - dq[0] > window:
        dq.popleft()
    if len(dq) >= limit:
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    dq.append(now)
    # Evict stale keys to prevent unbounded memory growth
    if len(_login_attempts) > _MAX_RATE_LIMIT_KEYS:
        stale = [k for k, v in list(_login_attempts.items()) if not v or now - v[-1] > window]
        for k in stale:
            _login_attempts.pop(k, None)


@auth_router.post("/register")
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing_user_by_name = await get_user_by_name(db, user_data.name)
    if existing_user_by_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this name already exists")
    existing_user_by_phone = await get_user_by_phone_number(db, user_data.phone_number)
    if existing_user_by_phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this phone number already exists")
    user = await create_user(db, user_data)
    logger.info(f"Created new user: {user.name} ({user.phone_number})")
    now_session_exp = _calc_session_exp(datetime.utcnow())
    access_token = create_access_token(data={"sub": str(user.id)}, session_exp=now_session_exp)
    refresh_token = create_refresh_token(data={"sub": str(user.id)}, session_exp=now_session_exp)
    user_payload = UserResponse.from_orm(user).dict()
    user_payload.pop("id", None)
    resp = JSONResponse(content=jsonable_encoder({"user": user_payload}))
    _set_auth_cookies(resp, access_token, refresh_token)
    return resp


@auth_router.post("/login")
async def login_user(
    user_credentials: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    check_login_rate_limit(user_credentials.name, client_ip)
    user = await get_user_by_name(db, user_credentials.name)
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")
    now_session_exp = _calc_session_exp(datetime.utcnow())
    access_token = create_access_token(data={"sub": str(user.id)}, session_exp=now_session_exp)
    refresh_token = create_refresh_token(data={"sub": str(user.id)}, session_exp=now_session_exp)
    logger.info(f"User logged in: {user.name} (ID: {user.id})")
    user_payload = UserResponse.from_orm(user).dict()
    user_payload.pop("id", None)
    resp = JSONResponse(content=jsonable_encoder({"user": user_payload}))
    _set_auth_cookies(resp, access_token, refresh_token)
    return resp


@auth_router.post("/refresh")
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token from body or headers
    """
    # Priority: HttpOnly cookie → request body → headers (for API clients)
    refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        try:
            body = await request.json()
            refresh_token_value = body.get("refresh_token") if body else None
        except Exception:
            pass

    if not refresh_token_value:
        refresh_token_value = (
            request.headers.get("Refresh-Token") or
            request.headers.get("refresh-token") or
            request.headers.get("X-Refresh-Token")
        )
    
    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required in request body or headers"
        )
    
    # Decode refresh token
    payload = decode_refresh_token(refresh_token_value)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    # Get user
    user_id = int(payload["sub"])
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    # Preserve original absolute session expiration if present
    sess_exp_ts = payload.get("sess_exp")
    if sess_exp_ts:
        sess_exp_dt = datetime.utcfromtimestamp(int(sess_exp_ts))
        if datetime.utcnow() >= sess_exp_dt:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please log in again.")
    else:
        sess_exp_dt = _calc_session_exp(datetime.utcnow())

    access_token = create_access_token(data={"sub": str(user.id)}, session_exp=sess_exp_dt)
    refresh_token = create_refresh_token(data={"sub": str(user.id)}, session_exp=sess_exp_dt)
    logger.info(f"Token refreshed for user: {user.name} (ID: {user.id})")
    user_payload = UserResponse.from_orm(user).dict()
    user_payload.pop("id", None)
    resp = JSONResponse(content=jsonable_encoder({"user": user_payload}))
    _set_auth_cookies(resp, access_token, refresh_token)
    return resp

@auth_router.post("/logout")
async def logout(request: Request):
    """Logout: clear HttpOnly cookies and invalidate in-memory cache for this user."""
    try:
        from app.auth.jwt import decode_access_token
        from app.core.cache import cache, invalidate_cache_pattern
        token = request.cookies.get("access_token")
        if token:
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                user_id = payload["sub"]
                await cache.clear_pattern(f"user:{user_id}")
                await invalidate_cache_pattern(f"orders:list:uid={user_id}")
                logger.info(f"Logged out user {user_id}, cache cleared")
    except Exception as e:
        logger.warning(f"Logout cache cleanup error: {e}")

    resp = JSONResponse(content={"message": "Logged out successfully"})
    _clear_auth_cookies(resp)
    return resp


@auth_router.post("/forgot-password")
async def forgot_password():
    """Password reset via this endpoint is not supported without verification."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Password reset requires verification. Contact support.",
    )

