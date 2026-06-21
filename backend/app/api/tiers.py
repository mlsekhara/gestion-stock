"""Routeurs Tiers : fournisseurs et clients (même modèle, `type` distinct)."""
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission
from app.db.session import get_db
from app.models.achat import Achat, ACH_RECUE
from app.models.tiers import TIERS_CLIENT, TIERS_FOURNISSEUR, Tiers
from app.models.utilisateur import Utilisateur
from app.models.vente import Vente, VenteLigne, PaiementVente, VTE_FACTURE, VEN_VALIDEE
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

# --- Relevé de compte client ---

releve_router = APIRouter(prefix="/clients", tags=["Clients"])
LIRE_RELEVE = exiger_permission("ventes:lire")


@releve_router.get("/{client_id}/releve")
def releve_compte(
    client_id: int,
    date_debut: date | None = Query(default=None),
    date_fin: date | None = Query(default=None),
    db: Session = Depends(get_db),
    u: Utilisateur = Depends(LIRE_RELEVE),
):
    client = db.get(Tiers, client_id)
    if client is None or client.entreprise_id != u.entreprise_id or client.type != TIERS_CLIENT:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Client introuvable")

    stmt = select(Vente).where(
        Vente.client_id == client_id,
        Vente.entreprise_id == u.entreprise_id,
        Vente.type == VTE_FACTURE,
        Vente.statut == VEN_VALIDEE,
    )
    if date_debut:
        stmt = stmt.where(Vente.date_validation >= datetime.combine(date_debut, datetime.min.time()))
    if date_fin:
        stmt = stmt.where(Vente.date_validation <= datetime.combine(date_fin, datetime.max.time()))

    ventes = db.scalars(stmt.order_by(Vente.date_validation.asc())).all()

    entries = []
    solde = Decimal("0")

    for v in ventes:
        for l in v.lignes:
            montant = l.quantite * l.prix_unitaire
            solde += montant
            entries.append({
                "date": v.date_validation.strftime("%d/%m/%Y") if v.date_validation else "",
                "type": "vente",
                "reference": v.reference,
                "designation": l.article.designation if l.article else "—",
                "quantite": float(l.quantite),
                "prix_unitaire": float(l.prix_unitaire),
                "debit": float(montant),
                "credit": 0.0,
                "solde": float(solde),
            })

        for p in v.paiements:
            solde -= p.montant
            entries.append({
                "date": p.created_at.strftime("%d/%m/%Y") if p.created_at else "",
                "type": "paiement",
                "reference": v.reference,
                "designation": f"Paiement ({p.methode})",
                "quantite": None,
                "prix_unitaire": None,
                "debit": 0.0,
                "credit": float(p.montant),
                "solde": float(solde),
            })

    return {
        "client": {"id": client.id, "nom": client.nom, "telephone": client.telephone, "adresse": client.adresse},
        "date_debut": date_debut.isoformat() if date_debut else None,
        "date_fin": date_fin.isoformat() if date_fin else None,
        "entries": entries,
        "total_debit": float(sum(e["debit"] for e in entries)),
        "total_credit": float(sum(e["credit"] for e in entries)),
        "solde_final": float(solde),
    }
