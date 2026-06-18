"""Routeur d'authentification : connexion, rafraîchissement, profil courant."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_utilisateur_courant
from app.core.security import (
    creer_access_token,
    creer_refresh_token,
    decoder_token,
    verifier_mot_de_passe,
)
from app.db.session import get_db
from app.models.magasin import Magasin
from app.models.utilisateur import Utilisateur
from app.schemas.auth import RefreshRequest, TokenPair, UtilisateurCourant

router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/login", response_model=TokenPair, summary="Connexion (OAuth2 password)")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenPair:
    # form_data.username contient l'adresse e-mail
    utilisateur = db.scalar(
        select(Utilisateur).where(Utilisateur.email == form_data.username)
    )
    if not utilisateur or not verifier_mot_de_passe(form_data.password, utilisateur.mot_de_passe_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou mot de passe incorrect",
        )
    if not utilisateur.actif:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Compte désactivé")

    sub = str(utilisateur.id)
    return TokenPair(
        access_token=creer_access_token(sub, utilisateur.entreprise_id),
        refresh_token=creer_refresh_token(sub, utilisateur.entreprise_id),
    )


@router.post("/refresh", response_model=TokenPair, summary="Rafraîchir le jeton d'accès")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    data = decoder_token(payload.refresh_token)
    if data is None or data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Jeton de rafraîchissement invalide")
    utilisateur = db.get(Utilisateur, int(data["sub"]))
    if utilisateur is None or not utilisateur.actif:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    sub = str(utilisateur.id)
    return TokenPair(
        access_token=creer_access_token(sub, utilisateur.entreprise_id),
        refresh_token=creer_refresh_token(sub, utilisateur.entreprise_id),
    )


@router.get("/me", response_model=UtilisateurCourant, summary="Profil de l'utilisateur connecté")
def lire_profil(
    utilisateur: Utilisateur = Depends(get_utilisateur_courant),
    db: Session = Depends(get_db),
) -> UtilisateurCourant:
    magasins = db.scalars(
        select(Magasin)
        .where(Magasin.entreprise_id == utilisateur.entreprise_id, Magasin.actif.is_(True))
        .order_by(Magasin.est_principal.desc(), Magasin.nom)
    ).all()
    return UtilisateurCourant(
        id=utilisateur.id,
        nom=utilisateur.nom,
        email=utilisateur.email,
        role=utilisateur.role.nom if utilisateur.role else None,
        permissions=utilisateur.permissions,
        entreprise=utilisateur.entreprise,
        magasin_id=utilisateur.magasin_id,
        magasins=magasins,
    )
