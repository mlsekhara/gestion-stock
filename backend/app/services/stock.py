"""Logique métier du stock : mouvements, prix d'achat moyen, alertes, inventaire.

Les fonctions modifient la session mais ne committent pas (le routeur appelant
décide de la transaction).
"""
from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalogue import Article
from app.models.stock import (
    AJUSTEMENT,
    ENTREE,
    SORTIE,
    TRANSFERT,
    TYPES_MOUVEMENT,
    Inventaire,
    INV_VALIDE,
    MouvementStock,
    Stock,
)

ZERO = Decimal("0")


def _erreur(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def get_or_create_stock(db: Session, entreprise_id: int, article_id: int, magasin_id: int) -> Stock:
    stock = db.scalar(
        select(Stock).where(Stock.article_id == article_id, Stock.magasin_id == magasin_id)
    )
    if stock is None:
        stock = Stock(
            entreprise_id=entreprise_id,
            article_id=article_id,
            magasin_id=magasin_id,
            quantite=ZERO,
        )
        db.add(stock)
        db.flush()
    return stock


def _maj_prix_moyen(article: Article, ancienne_qte: Decimal, qte_entree: Decimal, cout: Decimal) -> None:
    """Met à jour le prix d'achat moyen pondéré lors d'une entrée valorisée."""
    base = ancienne_qte if ancienne_qte > ZERO else ZERO
    total_qte = base + qte_entree
    if total_qte <= ZERO:
        return
    valeur = base * article.prix_achat_moyen + qte_entree * cout
    article.prix_achat_moyen = (valeur / total_qte).quantize(Decimal("0.01"))


def appliquer_mouvement(
    db: Session,
    *,
    entreprise_id: int,
    article: Article,
    magasin_id: int,
    type_mouvement: str,
    quantite: Decimal,
    cout_unitaire: Decimal | None = None,
    motif: str | None = None,
    note: str | None = None,
    magasin_destination_id: int | None = None,
    cree_par_id: int | None = None,
    autoriser_negatif: bool = False,
) -> MouvementStock:
    if type_mouvement not in TYPES_MOUVEMENT:
        raise _erreur(f"Type de mouvement inconnu : {type_mouvement}")

    if type_mouvement in (ENTREE, SORTIE, TRANSFERT) and quantite <= ZERO:
        raise _erreur("La quantité doit être strictement positive")
    if type_mouvement == AJUSTEMENT and quantite == ZERO:
        raise _erreur("L'ajustement ne peut pas être nul")

    stock = get_or_create_stock(db, entreprise_id, article.id, magasin_id)

    if type_mouvement == ENTREE:
        if cout_unitaire is not None and cout_unitaire > ZERO:
            _maj_prix_moyen(article, stock.quantite, quantite, cout_unitaire)
        stock.quantite += quantite

    elif type_mouvement == SORTIE:
        if not autoriser_negatif and quantite > stock.quantite:
            raise _erreur(
                f"Stock insuffisant ({stock.quantite}) pour la sortie de {quantite}"
            )
        stock.quantite -= quantite

    elif type_mouvement == AJUSTEMENT:
        # quantite est un delta signé
        nouvelle = stock.quantite + quantite
        if not autoriser_negatif and nouvelle < ZERO:
            raise _erreur("L'ajustement rendrait le stock négatif")
        stock.quantite = nouvelle

    elif type_mouvement == TRANSFERT:
        if not magasin_destination_id or magasin_destination_id == magasin_id:
            raise _erreur("Transfert : magasin de destination invalide")
        if not autoriser_negatif and quantite > stock.quantite:
            raise _erreur(f"Stock insuffisant ({stock.quantite}) pour le transfert")
        stock.quantite -= quantite
        dest = get_or_create_stock(db, entreprise_id, article.id, magasin_destination_id)
        dest.quantite += quantite

    mouvement = MouvementStock(
        entreprise_id=entreprise_id,
        article_id=article.id,
        magasin_id=magasin_id,
        magasin_destination_id=magasin_destination_id,
        type=type_mouvement,
        quantite=quantite,
        cout_unitaire=cout_unitaire,
        motif=motif,
        note=note,
        cree_par_id=cree_par_id,
    )
    db.add(mouvement)
    db.flush()
    return mouvement


def quantite_article(db: Session, article_id: int, magasin_id: int) -> Decimal:
    q = db.scalar(
        select(Stock.quantite).where(Stock.article_id == article_id, Stock.magasin_id == magasin_id)
    )
    return q if q is not None else ZERO


def kpis_stock(db: Session, entreprise_id: int, magasin_id: int) -> dict:
    """KPIs de l'écran Liste des produits pour un magasin (cf. capture 3)."""
    articles = db.scalars(
        select(Article).where(Article.entreprise_id == entreprise_id, Article.actif.is_(True))
    ).all()
    quantites = {
        row.article_id: row.quantite
        for row in db.execute(
            select(Stock.article_id, Stock.quantite).where(Stock.magasin_id == magasin_id)
        )
    }
    disponible = rupture = alerte = 0
    valeur = ZERO
    for a in articles:
        q = quantites.get(a.id, ZERO)
        valeur += q * a.prix_achat_moyen
        if q <= ZERO:
            rupture += 1
        else:
            disponible += 1
            if a.seuil_alerte > ZERO and q <= a.seuil_alerte:
                alerte += 1
    return {
        "nb_articles": len(articles),
        "disponible": disponible,
        "rupture": rupture,
        "alerte": alerte,
        "valeur_stock": valeur.quantize(Decimal("0.01")),
    }


def valider_inventaire(db: Session, inventaire: Inventaire, cree_par_id: int | None = None) -> int:
    """Valide un inventaire : crée les ajustements pour chaque écart. Retourne le nb d'ajustements."""
    if inventaire.statut == INV_VALIDE:
        raise _erreur("Inventaire déjà validé")
    nb = 0
    for ligne in inventaire.lignes:
        article = db.get(Article, ligne.article_id)
        if article is None:
            continue
        actuelle = quantite_article(db, ligne.article_id, inventaire.magasin_id)
        delta = ligne.quantite_comptee - actuelle
        if delta != ZERO:
            appliquer_mouvement(
                db,
                entreprise_id=inventaire.entreprise_id,
                article=article,
                magasin_id=inventaire.magasin_id,
                type_mouvement=AJUSTEMENT,
                quantite=delta,
                motif=f"Inventaire {inventaire.reference}",
                cree_par_id=cree_par_id,
                autoriser_negatif=True,
            )
            nb += 1
    inventaire.statut = INV_VALIDE
    db.flush()
    return nb


def prochaine_reference(db: Session, model, entreprise_id: int, prefixe: str) -> str:
    """Génère une référence séquentielle simple par entreprise (ex. INV-0001)."""
    n = db.scalar(select(func.count()).select_from(model).where(model.entreprise_id == entreprise_id)) or 0
    return f"{prefixe}-{n + 1:04d}"
