import time
from typing import Any, Dict, Optional, Callable
from functools import wraps


class SimpleAsyncCache:
    """In-memory async cache with TTL support.

    asyncio is single-threaded: no await occurs between any dict read/write
    below, so no asyncio.Lock is needed — Python dict operations are atomic
    within a single event-loop iteration.

    time.monotonic() is used instead of time.time() to be immune to NTP
    clock adjustments and to avoid float precision issues on some platforms.
    """

    def __init__(self, default_ttl: int = 60):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._default_ttl = default_ttl

    async def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry is None:
            return None
        if time.monotonic() < entry['expires']:
            return entry['value']
        del self._cache[key]
        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        self._cache[key] = {
            'value': value,
            'expires': time.monotonic() + (ttl or self._default_ttl),
        }

    async def delete(self, key: str) -> None:
        self._cache.pop(key, None)

    async def clear(self) -> None:
        self._cache.clear()

    async def cleanup_expired(self) -> None:
        now = time.monotonic()
        expired = [k for k, e in list(self._cache.items()) if now >= e['expires']]
        for k in expired:
            self._cache.pop(k, None)

    async def clear_pattern(self, pattern: str) -> None:
        keys = [k for k in list(self._cache) if pattern in k]
        for k in keys:
            self._cache.pop(k, None)


cache = SimpleAsyncCache(default_ttl=60)


def cached(ttl: int = 60, key_prefix: str = ""):
    """Decorator to cache async function results."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            parts = [key_prefix, func.__name__]
            for i, arg in enumerate(args):
                if 'Session' in arg.__class__.__name__:
                    continue
                parts.append(f"a{i}={arg}")
            for k in sorted(kwargs):
                v = kwargs[k]
                if 'Session' in v.__class__.__name__:
                    continue
                parts.append(f"{k}={v}")
            cache_key = ':'.join(parts)

            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            result = await func(*args, **kwargs)
            if result is not None:
                await cache.set(cache_key, result, ttl)
            return result

        return wrapper
    return decorator


async def invalidate_cache_pattern(pattern: str) -> None:
    """Invalidate all cache entries whose key contains the given substring."""
    keys = [k for k in list(cache._cache) if pattern in k]
    for k in keys:
        cache._cache.pop(k, None)
