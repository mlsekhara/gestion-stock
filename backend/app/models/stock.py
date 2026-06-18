"""Stock par magasin, mouvements de stock et inventaire."""
from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

# Types de mouvement
ENTREE = "entree"
SORTIE = "sortie"
AJUSTEMENT = "ajustement"
TRANSFERT = "transfert"
TYPES_MOUVEMENT = {ENTREE, SORTIE, AJUSTEMENT, TRANSFERT}

# Statuts d'inventaire
INV_BROUILLON = "brouillon"
INV_VALIDE = "valide"


class Stock(Base, TimestampMixin):
    """Quantité d'un article dans un magasin donné."""

    __tablename__ = "stocks"
    __table_args__ = (
        UniqueConstraint("article_id", "magasin_id", name="uq_stock_article_magasin"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    magasin_id: Mapped[int] = mapped_column(
        ForeignKey("magasins.id", ondelete="CASCADE"), index=True, nullable=False
    )
    quantite: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0"), nullable=False)


class MouvementStock(Base, TimestampMixin):
    """Trace d'un mouvement de stock (entrée, sortie, ajustement, transfert)."""

    __tablename__ = "mouvements_stock"

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    magasin_id: Mapped[int] = mapped_column(
        ForeignKey("magasins.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Pour un transfert : magasin de destination
    magasin_destination_id: Mapped[int | None] = mapped_column(ForeignKey("magasins.id", ondelete="SET NULL"))

    type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantite: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    cout_unitaire: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    motif: Mapped[str | None] = mapped_column(String(255))
    note: Mapped[str | None] = mapped_column(Text)
    cree_par_id: Mapped[int | None] = mapped_column(ForeignKey("utilisateurs.id", ondelete="SET NULL"))

    article: Mapped["object"] = relationship("Article", lazy="joined")


class Inventaire(Base, TimestampMixin):
    """En-tête d'inventaire (comptage) pour un magasin."""

    __tablename__ = "inventaires"

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    magasin_id: Mapped[int] = mapped_column(
        ForeignKey("magasins.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reference: Mapped[str] = mapped_column(String(40), nullable=False)
    statut: Mapped[str] = mapped_column(String(20), default=INV_BROUILLON, nullable=False)
    note: Mapped[str | None] = mapped_column(String(255))
    cree_par_id: Mapped[int | None] = mapped_column(ForeignKey("utilisateurs.id", ondelete="SET NULL"))

    lignes: Mapped[list["InventaireLigne"]] = relationship(
        back_populates="inventaire", cascade="all, delete-orphan", lazy="selectin"
    )


class InventaireLigne(Base):
    """Ligne d'inventaire : quantité théorique vs comptée pour un article."""

    __tablename__ = "inventaire_lignes"
    __table_args__ = (
        UniqueConstraint("inventaire_id", "article_id", name="uq_inv_ligne_article"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    inventaire_id: Mapped[int] = mapped_column(
        ForeignKey("inventaires.id", ondelete="CASCADE"), index=True, nullable=False
    )
    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), nullable=False
    )
    quantite_theorique: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0"), nullable=False)
    quantite_comptee: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0"), nullable=False)

    inventaire: Mapped["Inventaire"] = relationship(back_populates="lignes")
    article: Mapped["object"] = relationship("Article", lazy="joined")
