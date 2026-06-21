"""Routeurs Tiers : fournisseurs et clients (même modèle, `type` distinct)."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission
from app.db.session import get_db
from app.models.achat import Achat, ACH_RECUE
from app.models.tiers import TIERS_CLIENT, TIERS_FOURNISSEUR, Tiers
from app.models.utilisateur import Utilisateur
from app.models.vente import Vente, VTE_FACTURE, VEN_VALIDEE
from app.schemas.tiers import TiersCreate, TiersOut, TiersUpdate

LIRE = exiger_permission("tiers:lire")
GERER = exiger_permission("tiers:gerer")


def _make_router(type_tiers: str, prefix: str, tag: str) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("")
    def lister(q: str | None = Query(default=None), db: Session = Depends(get_db), u: Utilisateur = Depends(LIRE)):
        stmt = select(Tiers).where(Tiers.entreprise_id == u.entreprise_id, Tiers.type == type_tiers)
        if q:
            like = f"%{q}%"
            stmt = stmt.where(or_(Tiers.nom.ilike(like), Tiers.telephone.ilike(like)))
        tiers_list = db.scalars(stmt.order_by(Tiers.nom)).all()

        result = []
        for t in tiers_list:
            out = TiersOut.model_validate(t).model_dump()
            if type_tiers == TIERS_CLIENT:
                ventes = db.scalars(
                    select(Vente).where(
                        Vente.client_id == t.id, Vente.entreprise_id == u.entreprise_id,
                        Vente.type == VTE_FACTURE, Vente.statut == VEN_VALIDEE,
                    )
                ).all()
                out["total_achats_client"] = float(sum((v.montant_total for v in ventes), Decimal("0")))
                out["reste_a_payer"] = float(sum((v.reste_a_payer for v in ventes if v.reste_a_payer > 0), Decimal("0")))
            else:
                achats = db.scalars(
                    select(Achat).where(
                        Achat.fournisseur_id == t.id, Achat.entreprise_id == u.entreprise_id,
                        Achat.statut == ACH_RECUE,
                    )
                ).all()
                out["total_achats_fournisseur"] = float(sum((a.montant_total for a in achats), Decimal("0")))
                out["reste_a_payer"] = float(sum((a.reste_a_payer for a in achats if a.reste_a_payer > 0), Decimal("0")))
            result.append(out)
        return result

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
