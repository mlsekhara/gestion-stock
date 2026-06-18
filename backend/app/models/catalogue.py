"""Référentiels du catalogue : Famille, Marque, Unité, Taxe (TVA) et Article."""
from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Famille(Base, TimestampMixin):
    __tablename__ = "familles"
    __table_args__ = (UniqueConstraint("entreprise_id", "nom", name="uq_famille_nom"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nom: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))


class Marque(Base, TimestampMixin):
    __tablename__ = "marques"
    __table_args__ = (UniqueConstraint("entreprise_id", "nom", name="uq_marque_nom"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nom: Mapped[str] = mapped_column(String(120), nullable=False)


class Unite(Base, TimestampMixin):
    __tablename__ = "unites"
    __table_args__ = (UniqueConstraint("entreprise_id", "nom", name="uq_unite_nom"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nom: Mapped[str] = mapped_column(String(60), nullable=False)
    abreviation: Mapped[str | None] = mapped_column(String(12))


class Taxe(Base, TimestampMixin):
    __tablename__ = "taxes"
    __table_args__ = (UniqueConstraint("entreprise_id", "nom", name="uq_taxe_nom"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nom: Mapped[str] = mapped_column(String(60), nullable=False)
    taux: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"), nullable=False)


class Article(Base, TimestampMixin):
    __tablename__ = "articles"
    __table_args__ = (
        UniqueConstraint("entreprise_id", "reference", name="uq_article_reference"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reference: Mapped[str] = mapped_column(String(80), nullable=False)
    code_barres: Mapped[str | None] = mapped_column(String(80), index=True)
    designation: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    famille_id: Mapped[int | None] = mapped_column(ForeignKey("familles.id", ondelete="SET NULL"))
    marque_id: Mapped[int | None] = mapped_column(ForeignKey("marques.id", ondelete="SET NULL"))
    unite_id: Mapped[int | None] = mapped_column(ForeignKey("unites.id", ondelete="SET NULL"))
    taxe_id: Mapped[int | None] = mapped_column(ForeignKey("taxes.id", ondelete="SET NULL"))

    prix_achat_moyen: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"), nullable=False)
    prix_vente: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"), nullable=False)
    seuil_alerte: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0"), nullable=False)
    # Téléphonie : suivi des numéros de série / IMEI (champ optionnel, désactivé en générique)
    suivi_serie: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    famille: Mapped["Famille | None"] = relationship(lazy="joined")
    marque: Mapped["Marque | None"] = relationship(lazy="joined")
    unite: Mapped["Unite | None"] = relationship(lazy="joined")
    taxe: Mapped["Taxe | None"] = relationship(lazy="joined")
