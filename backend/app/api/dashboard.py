"""Tableau de bord consolidé avec filtres par période."""
from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, case, extract
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission, get_magasin_courant
from app.db.session import get_db
from app.models.achat import Achat, ACH_RECUE, PaiementAchat
from app.models.catalogue import Article, Famille
from app.models.magasin import Magasin
from app.models.stock import Stock
from app.models.tiers import Tiers, TIERS_CLIENT, TIERS_FOURNISSEUR
from app.models.utilisateur import Utilisateur
from app.models.vente import Vente, VTE_FACTURE, VEN_VALIDEE, PaiementVente

router = APIRouter(prefix="/dashboard", tags=["Tableau de bord"])
LIRE = exiger_permission("tableau_de_bord:lire")
ZERO = Decimal("0")


def _parse_period(periode: str | None) -> tuple[date | None, date | None]:
    today = date.today()
    if periode == "today":
        return today, today
    if periode == "week":
        return today - timedelta(days=today.weekday()), today
    if periode == "month":
        return today.replace(day=1), today
    if periode == "quarter":
        q_start_month = ((today.month - 1) // 3) * 3 + 1
        return today.replace(month=q_start_month, day=1), today
    if periode == "year":
        return today.replace(month=1, day=1), today
    return None, None


@router.get("/kpis")
def kpis_consolides(
    periode: str | None = Query(None),
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    eid = u.entreprise_id
    mid = magasin.id
    debut, fin = _parse_period(periode)

    # Stock KPIs (not period-dependent)
    articles = db.scalars(
        select(Article).where(Article.entreprise_id == eid, Article.actif.is_(True))
    ).all()
    quantites = {
        r.article_id: r.quantite
        for r in db.execute(select(Stock.article_id, Stock.quantite).where(Stock.magasin_id == mid))
    }
    nb_articles = len(articles)
    disponible = rupture = alerte = 0
    valeur_stock = ZERO
    for a in articles:
        q = quantites.get(a.id, ZERO)
        valeur_stock += q * a.prix_achat_moyen
        if q <= ZERO:
            rupture += 1
        else:
            disponible += 1
            if a.seuil_alerte > ZERO and q <= a.seuil_alerte:
                alerte += 1

    # Ventes KPIs (period-filtered)
    vq = select(Vente).where(
        Vente.entreprise_id == eid, Vente.magasin_id == mid,
        Vente.type == VTE_FACTURE, Vente.statut == VEN_VALIDEE,
    )
    if debut:
        vq = vq.where(func.date(Vente.date_validation) >= debut)
    if fin:
        vq = vq.where(func.date(Vente.date_validation) <= fin)
    ventes = db.scalars(vq).all()
    nb_ventes = len(ventes)
    ca = sum((v.montant_total for v in ventes), ZERO)
    marge = sum((v.marge_totale for v in ventes), ZERO)
    panier_moyen = (ca / nb_ventes).quantize(Decimal("0.01")) if nb_ventes else ZERO

    # Achats KPIs (period-filtered)
    aq = select(Achat).where(
        Achat.entreprise_id == eid, Achat.magasin_id == mid,
        Achat.statut == ACH_RECUE,
    )
    if debut:
        aq = aq.where(func.date(Achat.date_reception) >= debut)
    if fin:
        aq = aq.where(func.date(Achat.date_reception) <= fin)
    achats = db.scalars(aq).all()
    total_achats = sum((a.montant_total for a in achats), ZERO)

    # Tiers counts
    nb_clients = db.scalar(
        select(func.count(Tiers.id)).where(Tiers.entreprise_id == eid, Tiers.type == TIERS_CLIENT)
    ) or 0
    nb_fournisseurs = db.scalar(
        select(func.count(Tiers.id)).where(Tiers.entreprise_id == eid, Tiers.type == TIERS_FOURNISSEUR)
    ) or 0

    # Recouvrement
    total_creances = sum((v.reste_a_payer for v in ventes if v.reste_a_payer > ZERO), ZERO)

    return {
        "nb_articles": nb_articles,
        "disponible": disponible,
        "rupture": rupture,
        "alerte": alerte,
        "valeur_stock": float(valeur_stock.quantize(Decimal("0.01"))),
        "nb_ventes": nb_ventes,
        "chiffre_affaires": float(ca.quantize(Decimal("0.01"))),
        "marge": float(marge.quantize(Decimal("0.01"))),
        "panier_moyen": float(panier_moyen),
        "total_achats": float(total_achats.quantize(Decimal("0.01"))),
        "nb_clients": nb_clients,
        "nb_fournisseurs": nb_fournisseurs,
        "total_creances": float(total_creances.quantize(Decimal("0.01"))),
    }


@router.get("/ventes-par-jour")
def ventes_par_jour(
    jours: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    debut = date.today() - timedelta(days=jours)
    rows = db.execute(
        select(
            func.date(Vente.date_validation).label("jour"),
            func.sum(Vente.montant_total).label("ca"),
            func.count(Vente.id).label("nb"),
        )
        .where(
            Vente.entreprise_id == u.entreprise_id,
            Vente.magasin_id == magasin.id,
            Vente.type == VTE_FACTURE,
            Vente.statut == VEN_VALIDEE,
            func.date(Vente.date_validation) >= debut,
        )
        .group_by(func.date(Vente.date_validation))
        .order_by(func.date(Vente.date_validation))
    ).all()
    return [{"jour": str(r.jour), "ca": float(r.ca), "nb": r.nb} for r in rows]


@router.get("/top-articles")
def top_articles(
    limite: int = Query(10, ge=5, le=50),
    periode: str | None = Query(None),
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    from app.models.vente import VenteLigne
    debut, fin = _parse_period(periode)
    q = (
        select(
            Article.designation,
            func.sum(VenteLigne.quantite).label("qte_vendue"),
            func.sum(VenteLigne.montant).label("ca"),
        )
        .join(VenteLigne, VenteLigne.article_id == Article.id)
        .join(Vente, Vente.id == VenteLigne.vente_id)
        .where(
            Vente.entreprise_id == u.entreprise_id,
            Vente.magasin_id == magasin.id,
            Vente.type == VTE_FACTURE,
            Vente.statut == VEN_VALIDEE,
        )
    )
    if debut:
        q = q.where(func.date(Vente.date_validation) >= debut)
    if fin:
        q = q.where(func.date(Vente.date_validation) <= fin)
    rows = q.group_by(Article.designation).order_by(func.sum(VenteLigne.montant).desc()).limit(limite)
    return [{"designation": r.designation, "qte_vendue": float(r.qte_vendue), "ca": float(r.ca)} for r in db.execute(rows)]


@router.get("/stock-par-famille")
def stock_par_famille(
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    rows = db.execute(
        select(
            Famille.nom,
            func.count(Article.id).label("nb_articles"),
            func.coalesce(func.sum(Stock.quantite * Article.prix_achat_moyen), 0).label("valeur"),
        )
        .join(Article, Article.famille_id == Famille.id)
        .outerjoin(Stock, (Stock.article_id == Article.id) & (Stock.magasin_id == magasin.id))
        .where(Famille.entreprise_id == u.entreprise_id, Article.actif.is_(True))
        .group_by(Famille.nom)
        .order_by(func.sum(Stock.quantite * Article.prix_achat_moyen).desc())
    ).all()
    return [{"famille": r.nom, "nb_articles": r.nb_articles, "valeur": float(r.valeur)} for r in rows]
