"""Logique métier des primes : calcul CA et recouvrement par opérateur."""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.prime import PrimeConfig
from app.models.vente import Vente, VEN_VALIDEE, VTE_FACTURE, PaiementVente

ZERO = Decimal("0")

PERIODICITES = {"hebdomadaire", "mensuelle", "trimestrielle"}


def _bornes_periode(periodicite: str, ref: date | None = None) -> tuple[date, date]:
    """Retourne (date_debut, date_fin) pour la période courante."""
    today = ref or date.today()
    if periodicite == "hebdomadaire":
        debut = today - timedelta(days=today.weekday())
        fin = debut + timedelta(days=6)
    elif periodicite == "trimestrielle":
        q = (today.month - 1) // 3
        debut = date(today.year, q * 3 + 1, 1)
        mois_fin = q * 3 + 3
        if mois_fin == 12:
            fin = date(today.year, 12, 31)
        else:
            fin = date(today.year, mois_fin + 1, 1) - timedelta(days=1)
    else:
        debut = today.replace(day=1)
        if today.month == 12:
            fin = date(today.year, 12, 31)
        else:
            fin = date(today.year, today.month + 1, 1) - timedelta(days=1)
    return debut, fin


def _ca_operateur(db: Session, entreprise_id: int, utilisateur_id: int, debut: date, fin: date) -> Decimal:
    """CA réalisé par l'opérateur (ventes factures validées dans la période)."""
    ventes = db.scalars(
        select(Vente).where(
            Vente.entreprise_id == entreprise_id,
            Vente.cree_par_id == utilisateur_id,
            Vente.type == VTE_FACTURE,
            Vente.statut == VEN_VALIDEE,
            func.date(Vente.date_validation) >= debut,
            func.date(Vente.date_validation) <= fin,
        )
    ).all()
    return sum((v.montant_total for v in ventes), ZERO)


def _recouvrement_operateur(db: Session, entreprise_id: int, utilisateur_id: int, debut: date, fin: date) -> Decimal:
    """Montant des paiements encaissés sur les ventes de l'opérateur dans la période."""
    ventes_ids = db.scalars(
        select(Vente.id).where(
            Vente.entreprise_id == entreprise_id,
            Vente.cree_par_id == utilisateur_id,
            Vente.type == VTE_FACTURE,
            Vente.statut == VEN_VALIDEE,
        )
    ).all()
    if not ventes_ids:
        return ZERO
    total = db.scalar(
        select(func.coalesce(func.sum(PaiementVente.montant), 0)).where(
            PaiementVente.vente_id.in_(ventes_ids),
            func.date(PaiementVente.created_at) >= debut,
            func.date(PaiementVente.created_at) <= fin,
        )
    )
    return Decimal(str(total)) if total else ZERO


def calculer_prime(db: Session, config: PrimeConfig, entreprise_id: int) -> dict:
    """Calcule le bilan de prime pour un opérateur."""
    debut, fin = _bornes_periode(config.periodicite)
    ca = _ca_operateur(db, entreprise_id, config.utilisateur_id, debut, fin)
    recouvrement = _recouvrement_operateur(db, entreprise_id, config.utilisateur_id, debut, fin)

    prime_ca = (ca * config.taux_ca / 100).quantize(Decimal("0.01"))
    prime_rec = (recouvrement * config.taux_recouvrement / 100).quantize(Decimal("0.01"))

    return {
        "utilisateur_id": config.utilisateur_id,
        "utilisateur_nom": config.utilisateur.nom if config.utilisateur else "?",
        "taux_ca": config.taux_ca,
        "taux_recouvrement": config.taux_recouvrement,
        "periodicite": config.periodicite,
        "ca_realise": ca.quantize(Decimal("0.01")),
        "recouvrement_realise": recouvrement.quantize(Decimal("0.01")),
        "prime_ca": prime_ca,
        "prime_recouvrement": prime_rec,
        "prime_totale": prime_ca + prime_rec,
        "date_debut": debut.isoformat(),
        "date_fin": fin.isoformat(),
    }
