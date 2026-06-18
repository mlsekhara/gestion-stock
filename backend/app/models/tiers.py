"""Tiers : fournisseurs et clients (table unique différenciée par `type`)."""
from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

TIERS_FOURNISSEUR = "fournisseur"
TIERS_CLIENT = "client"


class Tiers(Base, TimestampMixin):
    __tablename__ = "tiers"

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # fournisseur | client
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    telephone: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))
    adresse: Mapped[str | None] = mapped_column(String(500))
    # Identifiants fiscaux (Algérie) — optionnels
    rc: Mapped[str | None] = mapped_column(String(60))   # Registre du Commerce
    nif: Mapped[str | None] = mapped_column(String(60))  # Numéro d'Identification Fiscale
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
