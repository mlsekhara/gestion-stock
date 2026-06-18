"""Dépendances FastAPI : utilisateur courant, scoping multi-tenant, contrôle des droits."""
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.permissions import has_permission
from app.core.security import decoder_token
from app.db.session import get_db
from app.models.magasin import Magasin
from app.models.utilisateur import Utilisateur

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login")

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Identifiants invalides ou jeton expiré",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_utilisateur_courant(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Utilisateur:
    payload = decoder_token(token)
    if payload is None or payload.get("type") != "access":
        raise _CREDENTIALS_EXC
    user_id = payload.get("sub")
    if user_id is None:
        raise _CREDENTIALS_EXC
    utilisateur = db.get(Utilisateur, int(user_id))
    if utilisateur is None or not utilisateur.actif:
        raise _CREDENTIALS_EXC
    # Vérifie la cohérence du tenant encodé dans le jeton
    if utilisateur.entreprise_id != payload.get("entreprise_id"):
        raise _CREDENTIALS_EXC
    return utilisateur


def exiger_permission(permission: str) -> Callable[[Utilisateur], Utilisateur]:
    """Fabrique de dépendance qui vérifie une permission précise."""

    def _verifier(utilisateur: Utilisateur = Depends(get_utilisateur_courant)) -> Utilisateur:
        if not has_permission(utilisateur.permissions, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Droit requis : {permission}",
            )
        return utilisateur

    return _verifier


def get_magasin_courant(
    x_magasin_id: Annotated[int | None, Header(alias="X-Magasin-Id")] = None,
    utilisateur: Utilisateur = Depends(get_utilisateur_courant),
    db: Session = Depends(get_db),
) -> Magasin:
    """Résout le magasin courant depuis l'en-tête X-Magasin-Id (sinon magasin par défaut).

    Vérifie systématiquement que le magasin appartient à l'entreprise de l'utilisateur.
    """
    magasin_id = x_magasin_id or utilisateur.magasin_id
    magasin = db.get(Magasin, magasin_id) if magasin_id else None
    if magasin is None:
        # Repli : premier magasin de l'entreprise
        magasin = db.scalar(
            select(Magasin)
            .where(Magasin.entreprise_id == utilisateur.entreprise_id, Magasin.actif.is_(True))
            .order_by(Magasin.est_principal.desc(), Magasin.id)
        )
    if magasin is None or magasin.entreprise_id != utilisateur.entreprise_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Magasin invalide")
    return magasin
