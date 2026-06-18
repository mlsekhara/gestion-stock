"""Logique métier des achats : réception (entrée en stock) et règlements."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.achat import ACH_ANNULEE, ACH_COMMANDE, ACH_RECUE, Achat
from app.models.catalogue import Article
from app.models.stock import ENTREE
from app.services import stock as stock_svc


def receptionner(db: Session, achat: Achat, cree_par_id: int | None = None) -> Achat:
    """Réceptionne une commande : entrée en stock de chaque ligne + prix moyen."""
    if achat.statut == ACH_RECUE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Achat déjà réceptionné")
    if achat.statut == ACH_ANNULEE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Achat annulé")
    if not achat.lignes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Aucune ligne à réceptionner")

    for ligne in achat.lignes:
        article = db.get(Article, ligne.article_id)
        if article is None or article.entreprise_id != achat.entreprise_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Article invalide")
        stock_svc.appliquer_mouvement(
            db,
            entreprise_id=achat.entreprise_id,
            article=article,
            magasin_id=achat.magasin_id,
            type_mouvement=ENTREE,
            quantite=ligne.quantite,
            cout_unitaire=ligne.cout_unitaire,
            motif=f"Réception achat {achat.reference}",
            cree_par_id=cree_par_id,
        )
    achat.statut = ACH_RECUE
    achat.date_reception = datetime.now(timezone.utc)
    db.flush()
    return achat
