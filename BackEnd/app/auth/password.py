import hmac
from passlib.context import CryptContext

_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed.startswith("$2"):
        # Legacy plaintext — reject outright. Plaintext passwords must not be
        # accepted; require a bcrypt-hashed value so that any admin-seeded
        # accounts with plain hashes cannot be used to authenticate.
        return False
    return _ctx.verify(plain, hashed)
