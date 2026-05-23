"""Core middleware: performance and security."""
import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor API performance"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timer
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Add performance headers
        response.headers["X-Process-Time"] = str(process_time)

        # Log slow requests (over 1 second)
        if process_time > 1.0:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {process_time:.2f}s"
            )

        # Log all requests in debug mode
        logger.debug(
            f"{request.method} {request.url.path} - "
            f"{response.status_code} - {process_time:.3f}s"
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Control referrer information leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Disable browser features not used by this API
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # HSTS: only meaningful on HTTPS connections; sending it over HTTP is a
        # no-op for browsers but causes confusion. nginx should also set this for
        # the HTTPS vhost, but we add it here as defence-in-depth when behind TLS.
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        # Do NOT set CSP on interactive docs/static assets to avoid blocking Swagger UI
        path = request.url.path
        _csp_excluded_prefixes = (
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
            "/static",
        )

        content_type = response.headers.get("content-type", "")
        if (
            "text/html" in content_type
            and not any(path.startswith(p) for p in _csp_excluded_prefixes)
        ):
            # Reasonable CSP for app HTML; allow inline styles for simplicity
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com data:; "
                "img-src 'self' data: blob:; "
                "connect-src 'self' https://api.stepupp.uz;"
            )

        return response
