"""Sécurité : hachage des mots de passe et jetons JWT."""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hacher_mot_de_passe(mot_de_passe: str) -> str:
    return pwd_context.hash(mot_de_passe)


def verifier_mot_de_passe(clair: str, hache: str) -> bool:
    return pwd_context.verify(clair, hache)


def _creer_token(data: dict[str, Any], expire_delta: timedelta, type_token: str) -> str:
    payload = data.copy()
    payload.update({
        "exp": datetime.now(timezone.utc) + expire_delta,
        "iat": datetime.now(timezone.utc),
        "type": type_token,
    })
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def creer_access_token(sub: str, entreprise_id: int) -> str:
    return _creer_token(
        {"sub": sub, "entreprise_id": entreprise_id},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "access",
    )


def creer_refresh_token(sub: str, entreprise_id: int) -> str:
    return _creer_token(
        {"sub": sub, "entreprise_id": entreprise_id},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "refresh",
    )


def decoder_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
