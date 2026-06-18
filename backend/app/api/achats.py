"""Routeur Achats : commandes, réception (entrée stock), paiements."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission, get_magasin_courant
from app.db.session import get_db
from app.models.achat import ACH_COMMANDE, ACH_RECUE, Achat, AchatLigne, PaiementAchat
from app.models.catalogue import Article
from app.models.magasin import Magasin
from app.models.tiers import TIERS_FOURNISSEUR, Tiers
from app.models.utilisateur import Utilisateur
from app.schemas.achat import AchatCreate, AchatLigneOut, AchatOut, PaiementCreate, PaiementOut
from app.services import achat as achat_svc
from app.services.stock import prochaine_reference

router = APIRouter(prefix="/achats", tags=["Achats"])

LIRE = exiger_permission("achats:lire")
GERER = exiger_permission("achats:gerer")


def _achat_out(a: Achat) -> AchatOut:
    total = a.montant_total
    paye = a.montant_paye
    return AchatOut(
        id=a.id, reference=a.reference, statut=a.statut, magasin_id=a.magasin_id,
        fournisseur_id=a.fournisseur_id, fournisseur_nom=a.fournisseur.nom if a.fournisseur else None,
        note=a.note, echeance=a.echeance, date_reception=a.date_reception, created_at=a.created_at,
        montant_total=total, montant_paye=paye, reste_a_payer=total - paye,
        lignes=[
            AchatLigneOut(
                id=l.id, article_id=l.article_id,
                article_designation=l.article.designation if l.article else None,
                quantite=l.quantite, cout_unitaire=l.cout_unitaire,
                montant=l.quantite * l.cout_unitaire,
            )
            for l in a.lignes
        ],
        paiements=[
            PaiementOut(id=p.id, montant=p.montant, methode=p.methode, note=p.note, created_at=p.created_at)
            for p in a.paiements
        ],
    )


@router.get("", response_model=list[AchatOut])
def lister(db: Session = Depends(get_db), u: Utilisateur = Depends(LIRE)):
    achats = db.scalars(
        select(Achat).where(Achat.entreprise_id == u.entreprise_id).order_by(Achat.created_at.desc())
    ).all()
    return [_achat_out(a) for a in achats]


@router.get("/{achat_id}", response_model=AchatOut)
def detail(achat_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(LIRE)):
    a = db.get(Achat, achat_id)
    if a is None or a.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    return _achat_out(a)


@router.post("", response_model=AchatOut, status_code=status.HTTP_201_CREATED)
def creer(
    payload: AchatCreate,
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(GERER),
):
    if payload.fournisseur_id is not None:
        f = db.get(Tiers, payload.fournisseur_id)
        if f is None or f.entreprise_id != u.entreprise_id or f.type != TIERS_FOURNISSEUR:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Fournisseur invalide")

    achat = Achat(
        entreprise_id=u.entreprise_id, magasin_id=magasin.id, fournisseur_id=payload.fournisseur_id,
        reference=prochaine_reference(db, Achat, u.entreprise_id, "BA"),
        statut=ACH_COMMANDE, note=payload.note, echeance=payload.echeance, cree_par_id=u.id,
    )
    db.add(achat)
    db.flush()
    for ligne in payload.lignes:
        article = db.get(Article, ligne.article_id)
        if article is None or article.entreprise_id != u.entreprise_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Article invalide")
        db.add(AchatLigne(
            achat_id=achat.id, article_id=ligne.article_id,
            quantite=ligne.quantite, cout_unitaire=ligne.cout_unitaire,
        ))
    db.commit()
    db.refresh(achat)
    return _achat_out(achat)


@router.post("/{achat_id}/receptionner", response_model=AchatOut)
def receptionner(achat_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
    a = db.get(Achat, achat_id)
    if a is None or a.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    achat_svc.receptionner(db, a, cree_par_id=u.id)
    db.commit()
    db.refresh(a)
    return _achat_out(a)


@router.post("/{achat_id}/paiements", response_model=AchatOut, status_code=status.HTTP_201_CREATED)
def ajouter_paiement(achat_id: int, payload: PaiementCreate, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
    a = db.get(Achat, achat_id)
    if a is None or a.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    db.add(PaiementAchat(achat_id=a.id, montant=payload.montant, methode=payload.methode, note=payload.note))
    db.commit()
    db.refresh(a)
    return _achat_out(a)


@router.delete("/{achat_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(achat_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
    a = db.get(Achat, achat_id)
    if a is None or a.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    if a.statut == ACH_RECUE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Impossible de supprimer un achat réceptionné")
    db.delete(a)
    db.commit()
