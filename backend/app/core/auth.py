import time
import uuid
from fastapi import HTTPException
from functools import lru_cache

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidAlgorithmError

from app.core.config import settings
from app.core.logging import logger


@lru_cache(maxsize=1)
def get_jwks_client() -> PyJWKClient:
    return PyJWKClient(settings.supabase_jwks_url, cache_jwk_set=True, lifespan=120)


def create_dev_token(user_id: str, email: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "user_metadata": {"full_name": email.split("@")[0], "email": email},
        "iat": now,
        "exp": now + 86400 * 7,
        "iss": "applyd-dev",
        "aud": "applyd-api",
    }
    return jwt.encode(payload, settings.DEV_SECRET, algorithm="HS256")


def decode_claims(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    algorithm = header.get("alg")
    key_id = header.get("kid")
    logger.debug(f"JWT header alg: {algorithm} | kid={key_id}")

    # Reject HS256 unless dev mode is explicitly enabled
    if algorithm == "HS256":
        if not settings.DEV_MODE:
            raise jwt.InvalidAlgorithmError("HS256 tokens rejected in non-dev mode")
        payload = jwt.decode(
            token,
            settings.DEV_SECRET,
            algorithms=["HS256"],
            leeway=30,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": True,
                "verify_iss": True,
            },
            audience="applyd-api",
            issuer="applyd-dev",
        )
        logger.debug(f"Dev JWT decoded for sub={payload.get('sub')}")
        return payload

    signing_key = get_jwks_client().get_signing_key_from_jwt(token)
    logger.debug(f"JWKS signing key matched: kid={key_id}")
    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256", "RS256"],
        leeway=30,
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_aud": False,
            "verify_iss": False,
        },
    )

    logger.debug(f"JWT decoded for sub={payload.get('sub')}")
    return payload

