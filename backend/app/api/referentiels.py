"""Routeurs CRUD des référentiels : familles, marques, unités, taxes."""
from typing import Type

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission, get_utilisateur_courant
from app.db.base import Base
from app.db.session import get_db
from app.models.catalogue import Famille, Marque, Taxe, Unite
from app.models.utilisateur import Utilisateur
from app.schemas.catalogue import (
    FamilleCreate,
    FamilleOut,
    MarqueCreate,
    RefOut,
    TaxeCreate,
    TaxeOut,
    UniteCreate,
    UniteOut,
)

LIRE = exiger_permission("articles:lire")
GERER = exiger_permission("articles:gerer")


def _make_router(
    *, prefix: str, tag: str, model: Type[Base], create_schema: Type[BaseModel], out_schema: Type[BaseModel]
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("", response_model=list[out_schema])
    def lister(db: Session = Depends(get_db), u: Utilisateur = Depends(LIRE)):
        return db.scalars(
            select(model).where(model.entreprise_id == u.entreprise_id).order_by(model.nom)
        ).all()

    @router.post("", response_model=out_schema, status_code=status.HTTP_201_CREATED)
    def creer(payload: create_schema, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
        obj = model(entreprise_id=u.entreprise_id, **payload.model_dump())
        db.add(obj)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Ce nom existe déjà")
        db.refresh(obj)
        return obj

    @router.put("/{obj_id}", response_model=out_schema)
    def modifier(obj_id: int, payload: create_schema, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
        obj = db.get(model, obj_id)
        if obj is None or obj.entreprise_id != u.entreprise_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
        for k, v in payload.model_dump().items():
            setattr(obj, k, v)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Ce nom existe déjà")
        db.refresh(obj)
        return obj

    @router.delete("/{obj_id}", status_code=status.HTTP_204_NO_CONTENT)
    def supprimer(obj_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
        obj = db.get(model, obj_id)
        if obj is None or obj.entreprise_id != u.entreprise_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
        db.delete(obj)
        db.commit()

    return router


familles_router = _make_router(prefix="/familles", tag="Familles", model=Famille, create_schema=FamilleCreate, out_schema=FamilleOut)
marques_router = _make_router(prefix="/marques", tag="Marques", model=Marque, create_schema=MarqueCreate, out_schema=RefOut)
unites_router = _make_router(prefix="/unites", tag="Unités", model=Unite, create_schema=UniteCreate, out_schema=UniteOut)
taxes_router = _make_router(prefix="/taxes", tag="Taxes", model=Taxe, create_schema=TaxeCreate, out_schema=TaxeOut)
