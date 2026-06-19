"""Routeur Primes : configuration admin + vue opérateur."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission, get_utilisateur_courant
from app.db.session import get_db
from app.models.prime import PrimeConfig
from app.models.utilisateur import Utilisateur
from app.schemas.prime import (
    PrimeBilanAdmin,
    PrimeBilanOperateur,
    PrimeConfigCreate,
    PrimeConfigOut,
    PrimeConfigUpdate,
)
from app.services.prime import calculer_prime

router = APIRouter(prefix="/primes", tags=["Primes"])

ADMIN = exiger_permission("parametres:gerer")


@router.get("/configs", response_model=list[PrimeConfigOut])
def lister_configs(db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    configs = db.scalars(
        select(PrimeConfig).where(PrimeConfig.entreprise_id == u.entreprise_id)
    ).all()
    return [
        PrimeConfigOut(
            id=c.id,
            utilisateur_id=c.utilisateur_id,
            utilisateur_nom=c.utilisateur.nom if c.utilisateur else None,
            taux_ca=c.taux_ca,
            taux_recouvrement=c.taux_recouvrement,
            periodicite=c.periodicite,
        )
        for c in configs
    ]


@router.post("/configs", response_model=PrimeConfigOut, status_code=status.HTTP_201_CREATED)
def creer_config(payload: PrimeConfigCreate, db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    user = db.get(Utilisateur, payload.utilisateur_id)
    if user is None or user.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Utilisateur invalide")
    existing = db.scalar(
        select(PrimeConfig).where(
            PrimeConfig.entreprise_id == u.entreprise_id,
            PrimeConfig.utilisateur_id == payload.utilisateur_id,
        )
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Configuration déjà existante pour cet utilisateur")
    config = PrimeConfig(
        entreprise_id=u.entreprise_id,
        utilisateur_id=payload.utilisateur_id,
        taux_ca=payload.taux_ca,
        taux_recouvrement=payload.taux_recouvrement,
        periodicite=payload.periodicite,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return PrimeConfigOut(
        id=config.id,
        utilisateur_id=config.utilisateur_id,
        utilisateur_nom=user.nom,
        taux_ca=config.taux_ca,
        taux_recouvrement=config.taux_recouvrement,
        periodicite=config.periodicite,
    )


@router.put("/configs/{config_id}", response_model=PrimeConfigOut)
def modifier_config(config_id: int, payload: PrimeConfigUpdate, db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    config = db.get(PrimeConfig, config_id)
    if config is None or config.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(config, field, val)
    db.commit()
    db.refresh(config)
    return PrimeConfigOut(
        id=config.id,
        utilisateur_id=config.utilisateur_id,
        utilisateur_nom=config.utilisateur.nom if config.utilisateur else None,
        taux_ca=config.taux_ca,
        taux_recouvrement=config.taux_recouvrement,
        periodicite=config.periodicite,
    )


@router.delete("/configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_config(config_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    config = db.get(PrimeConfig, config_id)
    if config is None or config.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    db.delete(config)
    db.commit()


@router.get("/bilan", response_model=list[PrimeBilanAdmin])
def bilan_admin(db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    """Vue admin : bilan complet avec CA et recouvrement pour tous les opérateurs configurés."""
    configs = db.scalars(
        select(PrimeConfig).where(PrimeConfig.entreprise_id == u.entreprise_id)
    ).all()
    return [calculer_prime(db, c, u.entreprise_id) for c in configs]


@router.get("/utilisateurs", response_model=list[dict])
def lister_utilisateurs(db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    """Liste des utilisateurs de l'entreprise (pour le select de configuration)."""
    users = db.scalars(
        select(Utilisateur).where(
            Utilisateur.entreprise_id == u.entreprise_id,
            Utilisateur.actif.is_(True),
        )
    ).all()
    return [{"id": usr.id, "nom": usr.nom, "email": usr.email} for usr in users]


@router.get("/ma-prime", response_model=PrimeBilanOperateur)
def ma_prime(db: Session = Depends(get_db), u: Utilisateur = Depends(get_utilisateur_courant)):
    """Vue opérateur : sa prime uniquement, sans le CA."""
    config = db.scalar(
        select(PrimeConfig).where(
            PrimeConfig.entreprise_id == u.entreprise_id,
            PrimeConfig.utilisateur_id == u.id,
        )
    )
    if config is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aucune prime configurée pour votre compte")
    bilan = calculer_prime(db, config, u.entreprise_id)
    return PrimeBilanOperateur(
        utilisateur_nom=bilan["utilisateur_nom"],
        taux_ca=bilan["taux_ca"],
        taux_recouvrement=bilan["taux_recouvrement"],
        periodicite=bilan["periodicite"],
        prime_ca=bilan["prime_ca"],
        prime_recouvrement=bilan["prime_recouvrement"],
        prime_totale=bilan["prime_totale"],
        date_debut=bilan["date_debut"],
        date_fin=bilan["date_fin"],
    )
