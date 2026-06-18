"""Modèle Magasin / Entrepôt — le stock est rattaché à un magasin."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.entreprise import Entreprise


class Magasin(Base, TimestampMixin):
    __tablename__ = "magasins"

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    adresse: Mapped[str | None] = mapped_column(String(500))
    telephone: Mapped[str | None] = mapped_column(String(50))
    est_principal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    entreprise: Mapped["Entreprise"] = relationship(back_populates="magasins")
