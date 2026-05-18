import os
import sys

# Ensure package imports work even when running with cwd set to `app/`.
# This inserts the repository root into sys.path so `import app.*` succeeds.
if __package__ is None:
    repo_root = os.path.dirname(os.path.dirname(__file__))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
import time
from datetime import datetime
from dotenv import load_dotenv

from app.core.config import settings
from app.core.middleware import (
    PerformanceMiddleware,
    CompressionHeaderMiddleware,
    SecurityHeadersMiddleware,
    BasicAuthRPCMiddleware,
)
from app.core.cache import cache
from app.db.database import init_db, close_db, AsyncSessionLocal
from app.api.endpoints import users, stepups, orders
from app.api import rpc as rpc_api
from app.api.endpoints import cart as cart_router
from app.api.endpoints import payment as payment_router
from app.auth.routes import auth_router
from app.schemas.responses import HealthCheckResponse

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

START_TIME = time.time()


async def warm_up_cache() -> None:
    """Warm up critical cache entries (e.g., product catalog) on startup.

    This makes the first user request to the catalog fast, since the
    `/stepups` list endpoint is already cached in memory.
    """

    try:
        async with AsyncSessionLocal() as db:
            # Preload the most common catalog view: first page, default sort,
            # no filters. This goes through the @cached wrapper on
            # `read_slippers`, so the result is stored in the in-memory cache.
            await stepups.read_slippers(
                skip=0,
                limit=20,
                search=None,
                sort="id_desc",
                db=db,
            )
        logger.info("✅ Warmed up product catalog cache (stepups)")
    except Exception as e:  # pragma: no cover - best-effort startup optimization
        logger.warning(f"Cache warmup failed: {e}")

# Application lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown with optimizations"""
    # Startup
    logger.info("🚀 Starting StepUp Order System...")
    
    try:
        # Initialize database
        await init_db()
        logger.info("✅ Database initialized")
        
        # Initialize cache
        await cache.clear()  # Start with clean cache
        logger.info("✅ Cache initialized")
        
        # Warm up critical cache entries if needed
        await warm_up_cache()
        
        logger.info("✅ Application started successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down...")
    
    try:
        # Clean up cache
        await cache.clear()
        logger.info("✅ Cache cleared")
        
        # Close database connections
        await close_db()
        logger.info("✅ Database connections closed")
        
        logger.info("✅ Application shutdown complete!")
        
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}")

# Create FastAPI application with optimizations
# Docs endpoints are only exposed when DEBUG=True to avoid leaking the API
# surface in production environments.
_docs_url = "/docs" if settings.DEBUG else None
_redoc_url = "/redoc" if settings.DEBUG else None
_openapi_url = "/openapi.json" if settings.DEBUG else None

app = FastAPI(
    title="StepUp Order System API",
    version="2.0.0",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Authentication", "description": "User authentication and authorization"},
        {"name": "Users", "description": "User management (admin only)"},
        {"name": "StepUps", "description": "StepUp catalog and image management"},
        {"name": "Orders", "description": "Order processing and tracking"},
    ],
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url=_openapi_url,
)
"""CORS middleware configuration
We support both a concrete allow_origins list and a regex (allow_origin_regex) to
cover www/non-www and subdomain variants. Trailing slashes are stripped since
the browser's Origin header never contains them. If ALLOWED_ORIGIN_REGEX is set,
it takes precedence over the explicit list.
"""
# Normalize origins
allowed: list[str] = []
for o in settings.ALLOWED_ORIGINS.split(','):
    o = (o or "").strip()
    if not o:
        continue
    if o.endswith('/'):
        o = o[:-1]
    allowed.append(o)

cors_kwargs = dict(
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Idempotency-Key", "X-Requested-With"],
    expose_headers=["X-Process-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

# Allow both explicit origins and regex simultaneously.
# This ensures localhost works in development even when a production regex is configured.
cors_kwargs["allow_origins"] = allowed
origin_regex = getattr(settings, "ALLOWED_ORIGIN_REGEX", None)
# In DEBUG, be permissive to avoid accidental CORS blocks during development or staging
if settings.DEBUG and not origin_regex:
    origin_regex = r".*"
if origin_regex:
    cors_kwargs["allow_origin_regex"] = origin_regex

# Startup log for visibility
print(f"[CORS] allowed_origins={allowed} regex={origin_regex}")

# Performance middleware
app.add_middleware(PerformanceMiddleware)
app.add_middleware(CompressionHeaderMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BasicAuthRPCMiddleware)

# GZip compression for responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Simple global rate limiting middleware (IP-based).
# NOTE: This is in-process, in-memory state. It resets on every restart and
# is NOT shared across multiple workers. For production deployments with more
# than one worker, replace with a Redis-backed rate limiter (e.g. slowapi +
# redis, or a custom middleware using aioredis).
from collections import defaultdict, deque
_req_log = defaultdict(deque)
_exclude = {p.strip() for p in settings.RATE_LIMIT_EXCLUDE_PATHS.split(',') if p.strip()}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Always let CORS preflight pass through quickly
    if request.method == "OPTIONS":
        # Return minimal OK for preflight if another route/middleware doesn't handle it
        response = JSONResponse(status_code=200, content={})
        # When allow_credentials is true, Access-Control-Allow-Origin cannot be '*', so FastAPI's CORS
        # will set the echo origin. Here we just return early to avoid other middlewares blocking it.
        return response
    path = request.url.path
    if path in _exclude:
        return await call_next(request)

    # Identify client IP
    if settings.TRUST_PROXY:
        fwd = request.headers.get("x-forwarded-for")
        client_ip = fwd.split(',')[0].strip() if fwd else request.client.host
    else:
        client_ip = request.client.host

    now = time.time()
    window = settings.RATE_LIMIT_WINDOW_SEC
    limit = settings.RATE_LIMIT_REQUESTS
    dq = _req_log[client_ip]
    while dq and now - dq[0] > window:
        dq.popleft()
    if len(dq) >= limit:
        reset_in = int(max(0, window - (now - dq[0]))) if dq else window
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests"},
            headers={
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_in)
            }
        )
    dq.append(now)
    remaining = max(0, limit - len(dq))
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    reset_in = int(max(0, window - (now - dq[0]))) if dq else window
    response.headers["X-RateLimit-Reset"] = str(reset_in)
    return response

# Register CORS middleware LAST so it becomes the outermost middleware and reliably
# handles preflight OPTIONS before other middlewares can interfere.
app.add_middleware(CORSMiddleware, **cors_kwargs)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for better error responses"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if os.getenv("DEBUG", "False").lower() == "true" else "Something went wrong"
        }
    )

# Include routers

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(stepups.router, prefix="/stepups", tags=["StepUps"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
# Cart router already defines its tag; avoid re-specifying to prevent duplicates
app.include_router(cart_router.router)
# JSON-RPC endpoint for acquiring
app.include_router(rpc_api.router, prefix="/api")
"""Payment redirect endpoint for bank acquiring.

Exposed as:
- GET /api/payment/init/{order_id}?amount=...

It is implemented in app/api/endpoints/payment.py and uses AcquiringClient
to obtain a payment URL, then returns a RedirectResponse to that URL.
"""
app.include_router(payment_router.router, prefix="/api")
# System diagnostics router removed

# Serve static files (images, etc.)
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with welcome message and basic API info"""
    return {
        "message": "StepUp Order System API",
        "version": "2.0.0",
        "status": "operational",
    }


# Health check endpoint — probes both DB and cache rather than hardcoding True.
@app.get("/health", tags=["System"], response_model=HealthCheckResponse)
async def health_check() -> HealthCheckResponse:
    """Health check endpoint for monitoring.

    Performs a lightweight probe against the database (SELECT 1) and the
    in-memory cache (set + get a sentinel key) so that load-balancers and
    monitoring tools receive an accurate signal.
    """
    from sqlalchemy import text as _text
    from app.db.database import AsyncSessionLocal as _SessionLocal

    db_ok = False
    try:
        async with _SessionLocal() as _db:
            await _db.execute(_text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    cache_ok = False
    try:
        _sentinel_key = "__health_probe__"
        await cache.set(_sentinel_key, "1", ttl=5)
        _val = await cache.get(_sentinel_key)
        cache_ok = _val == "1"
    except Exception:
        cache_ok = False

    overall = "healthy" if (db_ok and cache_ok) else "degraded"
    return HealthCheckResponse(
        status=overall,
        timestamp=datetime.utcnow(),
        version="2.0.0",
        database=db_ok,
        cache=cache_ok,
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
    host=settings.APP_HOST,
    port=settings.APP_PORT,
        reload=True,
        log_level="info"
    ) 