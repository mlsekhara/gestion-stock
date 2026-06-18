"""Routeurs Tiers : fournisseurs et clients (même modèle, `type` distinct)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission
from app.db.session import get_db
from app.models.tiers import TIERS_CLIENT, TIERS_FOURNISSEUR, Tiers
from app.models.utilisateur import Utilisateur
from app.schemas.tiers import TiersCreate, TiersOut, TiersUpdate

LIRE = exiger_permission("tiers:lire")
GERER = exiger_permission("tiers:gerer")


def _make_router(type_tiers: str, prefix: str, tag: str) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("", response_model=list[TiersOut])
    def lister(q: str | None = Query(default=None), db: Session = Depends(get_db), u: Utilisateur = Depends(LIRE)):
        stmt = select(Tiers).where(Tiers.entreprise_id == u.entreprise_id, Tiers.type == type_tiers)
        if q:
            like = f"%{q}%"
            stmt = stmt.where(or_(Tiers.nom.ilike(like), Tiers.telephone.ilike(like)))
        return db.scalars(stmt.order_by(Tiers.nom)).all()

    @router.post("", response_model=TiersOut, status_code=status.HTTP_201_CREATED)
    def creer(payload: TiersCreate, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
        obj = Tiers(entreprise_id=u.entreprise_id, type=type_tiers, **payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    @router.put("/{tiers_id}", response_model=TiersOut)
    def modifier(tiers_id: int, payload: TiersUpdate, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
        obj = db.get(Tiers, tiers_id)
        if obj is None or obj.entreprise_id != u.entreprise_id or obj.type != type_tiers:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        return obj

    @router.delete("/{tiers_id}", status_code=status.HTTP_204_NO_CONTENT)
    def supprimer(tiers_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
        obj = db.get(Tiers, tiers_id)
        if obj is None or obj.entreprise_id != u.entreprise_id or obj.type != type_tiers:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
        db.delete(obj)
        db.commit()

    return router


fournisseurs_router = _make_router(TIERS_FOURNISSEUR, "/fournisseurs", "Fournisseurs")
clients_router = _make_router(TIERS_CLIENT, "/clients", "Clients")
