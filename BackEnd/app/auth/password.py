import hmac
from passlib.context import CryptContext

_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed.startswith("$2"):
        # Legacy plaintext — support migration period; remove after all users re-login.
        # Use hmac.compare_digest to prevent timing attacks during the migration window.
        return hmac.compare_digest(plain, hashed)
    return _ctx.verify(plain, hashed)
