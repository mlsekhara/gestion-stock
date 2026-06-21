"""Documents de vente : Vente (proforma / facture / retour), lignes et paiements."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

# Types de vente
VTE_FACTURE = "facture"
VTE_PROFORMA = "proforma"
VTE_RETOUR = "retour"

# Statuts
VEN_BROUILLON = "brouillon"
VEN_VALIDEE = "validee"
VEN_ANNULEE = "annulee"

PREFIXE_TYPE = {VTE_FACTURE: "FV", VTE_PROFORMA: "PF", VTE_RETOUR: "RT"}


class Vente(Base, TimestampMixin):
    __tablename__ = "ventes"

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    magasin_id: Mapped[int] = mapped_column(ForeignKey("magasins.id", ondelete="CASCADE"), nullable=False)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("tiers.id", ondelete="SET NULL"))

    reference: Mapped[str] = mapped_column(String(40), nullable=False)
    type: Mapped[str] = mapped_column(String(20), default=VTE_FACTURE, nullable=False)
    statut: Mapped[str] = mapped_column(String(20), default=VEN_BROUILLON, nullable=False)
    note: Mapped[str | None] = mapped_column(String(255))
    echeance: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    date_validation: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cree_par_id: Mapped[int | None] = mapped_column(ForeignKey("utilisateurs.id", ondelete="SET NULL"))

    client: Mapped["object"] = relationship("Tiers", lazy="joined")
    lignes: Mapped[list["VenteLigne"]] = relationship(
        back_populates="vente", cascade="all, delete-orphan", lazy="selectin"
    )
    paiements: Mapped[list["PaiementVente"]] = relationship(
        back_populates="vente", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def montant_total(self) -> Decimal:
        return sum((l.quantite * l.prix_unitaire for l in self.lignes), Decimal("0"))

    @property
    def montant_paye(self) -> Decimal:
        return sum((p.montant for p in self.paiements), Decimal("0"))

    @property
    def reste_a_payer(self) -> Decimal:
        return self.montant_total - self.montant_paye

    @property
    def marge_totale(self) -> Decimal:
        # Marge connue seulement après validation (coût figé sur chaque ligne)
        return sum(
            ((l.prix_unitaire - l.cout_unitaire) * l.quantite for l in self.lignes if l.cout_unitaire is not None),
            Decimal("0"),
        )


class VenteLigne(Base):
    __tablename__ = "vente_lignes"

    id: Mapped[int] = mapped_column(primary_key=True)
    vente_id: Mapped[int] = mapped_column(ForeignKey("ventes.id", ondelete="CASCADE"), index=True, nullable=False)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id", ondelete="RESTRICT"), nullable=False)
    quantite: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    prix_unitaire: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    # Coût unitaire figé à la validation (= prix d'achat moyen) pour le calcul de marge
    cout_unitaire: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))

    vente: Mapped["Vente"] = relationship(back_populates="lignes")
    article: Mapped["object"] = relationship("Article", lazy="joined")


class PaiementVente(Base, TimestampMixin):
    __tablename__ = "paiements_vente"

    id: Mapped[int] = mapped_column(primary_key=True)
    vente_id: Mapped[int] = mapped_column(ForeignKey("ventes.id", ondelete="CASCADE"), index=True, nullable=False)
    montant: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    methode: Mapped[str] = mapped_column(String(40), default="espèces", nullable=False)
    note: Mapped[str | None] = mapped_column(Text)

    vente: Mapped["Vente"] = relationship(back_populates="paiements")
