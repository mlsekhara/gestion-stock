"""Routeur Ventes : proforma / facture / retour, validation, paiements, KPIs."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission, get_magasin_courant
from app.db.session import get_db
from app.models.catalogue import Article
from app.models.magasin import Magasin
from app.models.tiers import TIERS_CLIENT, Tiers
from app.models.utilisateur import Utilisateur
from app.models.vente import (
    PREFIXE_TYPE,
    VEN_VALIDEE,
    VTE_FACTURE,
    VTE_PROFORMA,
    VTE_RETOUR,
    PaiementVente,
    Vente,
    VenteLigne,
)
from app.schemas.vente import (
    KpisVentes,
    PaiementCreate,
    PaiementOut,
    VenteCreate,
    VenteLigneOut,
    VenteOut,
)
from app.services import vente as vente_svc
from app.services.stock import prochaine_reference

router = APIRouter(prefix="/ventes", tags=["Ventes"])

LIRE = exiger_permission("ventes:lire")
GERER = exiger_permission("ventes:gerer")

_TYPES = {VTE_FACTURE, VTE_PROFORMA, VTE_RETOUR}


def _vente_out(v: Vente) -> VenteOut:
    total = v.montant_total
    paye = v.montant_paye
    return VenteOut(
        id=v.id, reference=v.reference, type=v.type, statut=v.statut, magasin_id=v.magasin_id,
        client_id=v.client_id, client_nom=v.client.nom if v.client else None,
        note=v.note, echeance=v.echeance, date_validation=v.date_validation, created_at=v.created_at,
        montant_total=total, montant_paye=paye, reste_a_payer=total - paye, marge_totale=v.marge_totale,
        lignes=[
            VenteLigneOut(
                id=l.id, article_id=l.article_id,
                article_designation=l.article.designation if l.article else None,
                quantite=l.quantite, prix_unitaire=l.prix_unitaire, cout_unitaire=l.cout_unitaire,
                montant=l.quantite * l.prix_unitaire,
            )
            for l in v.lignes
        ],
        paiements=[
            PaiementOut(id=p.id, montant=p.montant, methode=p.methode, note=p.note, created_at=p.created_at)
            for p in v.paiements
        ],
    )


@router.get("/kpis", response_model=KpisVentes)
def kpis(db: Session = Depends(get_db), magasin: Magasin = Depends(get_magasin_courant), u: Utilisateur = Depends(LIRE)):
    return vente_svc.kpis_ventes(db, u.entreprise_id, magasin.id)


@router.get("", response_model=list[VenteOut])
def lister(db: Session = Depends(get_db), u: Utilisateur = Depends(LIRE)):
    ventes = db.scalars(
        select(Vente).where(Vente.entreprise_id == u.entreprise_id).order_by(Vente.created_at.desc())
    ).all()
    return [_vente_out(v) for v in ventes]


@router.get("/{vente_id}", response_model=VenteOut)
def detail(vente_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(LIRE)):
    v = db.get(Vente, vente_id)
    if v is None or v.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    return _vente_out(v)


@router.post("", response_model=VenteOut, status_code=status.HTTP_201_CREATED)
def creer(
    payload: VenteCreate,
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(GERER),
):
    if payload.type not in _TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Type de vente invalide")
    if payload.client_id is not None:
        c = db.get(Tiers, payload.client_id)
        if c is None or c.entreprise_id != u.entreprise_id or c.type != TIERS_CLIENT:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Client invalide")

    vente = Vente(
        entreprise_id=u.entreprise_id, magasin_id=magasin.id, client_id=payload.client_id,
        reference=prochaine_reference(db, Vente, u.entreprise_id, PREFIXE_TYPE[payload.type]),
        type=payload.type, note=payload.note, echeance=payload.echeance, cree_par_id=u.id,
    )
    db.add(vente)
    db.flush()
    for ligne in payload.lignes:
        article = db.get(Article, ligne.article_id)
        if article is None or article.entreprise_id != u.entreprise_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Article invalide")
        db.add(VenteLigne(
            vente_id=vente.id, article_id=ligne.article_id,
            quantite=ligne.quantite, prix_unitaire=ligne.prix_unitaire,
        ))
    db.commit()
    db.refresh(vente)
    return _vente_out(vente)


@router.post("/{vente_id}/valider", response_model=VenteOut)
def valider(vente_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
    v = db.get(Vente, vente_id)
    if v is None or v.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    vente_svc.valider(db, v, cree_par_id=u.id)
    db.commit()
    db.refresh(v)
    return _vente_out(v)


@router.post("/{vente_id}/paiements", response_model=VenteOut, status_code=status.HTTP_201_CREATED)
def ajouter_paiement(vente_id: int, payload: PaiementCreate, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
    v = db.get(Vente, vente_id)
    if v is None or v.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    db.add(PaiementVente(vente_id=v.id, montant=payload.montant, methode=payload.methode, note=payload.note))
    db.commit()
    db.refresh(v)
    return _vente_out(v)


@router.delete("/{vente_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(vente_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
    v = db.get(Vente, vente_id)
    if v is None or v.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    if v.statut == VEN_VALIDEE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Impossible de supprimer une vente validée")
    db.delete(v)
    db.commit()
