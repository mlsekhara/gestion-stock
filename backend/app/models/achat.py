"""Documents d'achat : Achat (commande → réception), lignes et paiements."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

# Statuts d'un achat
ACH_COMMANDE = "commande"
ACH_RECUE = "recue"
ACH_ANNULEE = "annulee"


class Achat(Base, TimestampMixin):
    __tablename__ = "achats"

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    magasin_id: Mapped[int] = mapped_column(ForeignKey("magasins.id", ondelete="CASCADE"), nullable=False)
    fournisseur_id: Mapped[int | None] = mapped_column(ForeignKey("tiers.id", ondelete="SET NULL"))

    reference: Mapped[str] = mapped_column(String(40), nullable=False)
    statut: Mapped[str] = mapped_column(String(20), default=ACH_COMMANDE, nullable=False)
    note: Mapped[str | None] = mapped_column(String(255))
    echeance: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    date_reception: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cree_par_id: Mapped[int | None] = mapped_column(ForeignKey("utilisateurs.id", ondelete="SET NULL"))

    fournisseur: Mapped["object"] = relationship("Tiers", lazy="joined")
    lignes: Mapped[list["AchatLigne"]] = relationship(
        back_populates="achat", cascade="all, delete-orphan", lazy="selectin"
    )
    paiements: Mapped[list["PaiementAchat"]] = relationship(
        back_populates="achat", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def montant_total(self) -> Decimal:
        return sum((l.quantite * l.cout_unitaire for l in self.lignes), Decimal("0"))

    @property
    def montant_paye(self) -> Decimal:
        return sum((p.montant for p in self.paiements), Decimal("0"))

    @property
    def reste_a_payer(self) -> Decimal:
        return self.montant_total - self.montant_paye


class AchatLigne(Base):
    __tablename__ = "achat_lignes"

    id: Mapped[int] = mapped_column(primary_key=True)
    achat_id: Mapped[int] = mapped_column(ForeignKey("achats.id", ondelete="CASCADE"), index=True, nullable=False)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id", ondelete="RESTRICT"), nullable=False)
    quantite: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    cout_unitaire: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    achat: Mapped["Achat"] = relationship(back_populates="lignes")
    article: Mapped["object"] = relationship("Article", lazy="joined")


class PaiementAchat(Base, TimestampMixin):
    __tablename__ = "paiements_achat"

    id: Mapped[int] = mapped_column(primary_key=True)
    achat_id: Mapped[int] = mapped_column(ForeignKey("achats.id", ondelete="CASCADE"), index=True, nullable=False)
    montant: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    methode: Mapped[str] = mapped_column(String(40), default="espèces", nullable=False)
    note: Mapped[str | None] = mapped_column(Text)

    achat: Mapped["Achat"] = relationship(back_populates="paiements")
