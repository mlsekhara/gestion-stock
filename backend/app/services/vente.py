"""Logique métier des ventes : validation (sortie de stock + marge), KPIs."""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalogue import Article
from app.models.stock import ENTREE, SORTIE
from app.models.vente import (
    VEN_ANNULEE,
    VEN_VALIDEE,
    VTE_FACTURE,
    VTE_PROFORMA,
    VTE_RETOUR,
    Vente,
)
from app.services import stock as stock_svc

ZERO = Decimal("0")


def valider(db: Session, vente: Vente, cree_par_id: int | None = None) -> Vente:
    """Valide une vente :

    - facture  → sortie de stock + fige le coût (marge)
    - retour   → entrée de stock (réintégration)
    - proforma → aucun mouvement (devis)
    """
    if vente.statut == VEN_VALIDEE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Vente déjà validée")
    if vente.statut == VEN_ANNULEE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Vente annulée")
    if not vente.lignes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Aucune ligne")

    for ligne in vente.lignes:
        article = db.get(Article, ligne.article_id)
        if article is None or article.entreprise_id != vente.entreprise_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Article invalide")

        if vente.type == VTE_FACTURE:
            # Coût figé = prix d'achat moyen courant (pour la marge)
            ligne.cout_unitaire = article.prix_achat_moyen
            stock_svc.appliquer_mouvement(
                db, entreprise_id=vente.entreprise_id, article=article, magasin_id=vente.magasin_id,
                type_mouvement=SORTIE, quantite=ligne.quantite,
                motif=f"Vente {vente.reference}", cree_par_id=cree_par_id,
            )
        elif vente.type == VTE_RETOUR:
            ligne.cout_unitaire = article.prix_achat_moyen
            stock_svc.appliquer_mouvement(
                db, entreprise_id=vente.entreprise_id, article=article, magasin_id=vente.magasin_id,
                type_mouvement=ENTREE, quantite=ligne.quantite, cout_unitaire=article.prix_achat_moyen,
                motif=f"Retour {vente.reference}", cree_par_id=cree_par_id,
            )
        # proforma : aucun mouvement

    vente.statut = VEN_VALIDEE
    vente.date_validation = datetime.now(timezone.utc)
    db.flush()
    return vente


def kpis_ventes(db: Session, entreprise_id: int, magasin_id: int) -> dict:
    """Indicateurs des ventes facturées validées pour un magasin (cf. capture 4)."""
    ventes = db.scalars(
        select(Vente).where(
            Vente.entreprise_id == entreprise_id,
            Vente.magasin_id == magasin_id,
            Vente.type == VTE_FACTURE,
            Vente.statut == VEN_VALIDEE,
        )
    ).all()
    nb = len(ventes)
    ca = sum((v.montant_total for v in ventes), ZERO)
    marge = sum((v.marge_totale for v in ventes), ZERO)
    panier = (ca / nb).quantize(Decimal("0.01")) if nb else ZERO
    return {
        "nb_ventes": nb,
        "chiffre_affaires": ca.quantize(Decimal("0.01")),
        "marge": marge.quantize(Decimal("0.01")),
        "panier_moyen": panier,
    }
