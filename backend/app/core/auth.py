import time
from fastapi import HTTPException
from functools import lru_cache

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidAlgorithmError

from app.core.config import settings
from app.core.logging import logger


@lru_cache(maxsize=1)
def get_jwks_client() -> PyJWKClient:
    return PyJWKClient(settings.supabase_jwks_url, cache_jwk_set=True, lifespan=300)


def decode_claims(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    algorithm = header.get("alg")
    key_id = header.get("kid")
    logger.debug(f"JWT header alg: {algorithm} | kid={key_id}")

    if algorithm not in {"ES256", "RS256"}:
        raise InvalidAlgorithmError("Unsupported JWT algorithm")

    signing_key = get_jwks_client().get_signing_key_from_jwt(token)
    logger.debug(f"JWKS signing key matched: kid={key_id}")
    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256", "RS256"],
        leeway=120,
        options={
            "verify_signature": True,
            "verify_exp": False,
            "verify_aud": False,
            "verify_iss": False,
        },
    )
    
    exp = payload.get("exp")
    if not exp or exp < (time.time() - 60):
        logger.warning(f"Token expired: exp={exp}, time={time.time()}")
        # raise HTTPException(status_code=401, detail="Token expired")

    print("PAYLOAD:", payload)
    logger.debug(f"JWT decoded for sub={payload.get('sub')}")
    return payload

