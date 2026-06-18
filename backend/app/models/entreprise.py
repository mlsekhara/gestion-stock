"""Modèle Entreprise — le tenant racine du système multi-magasins."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.magasin import Magasin
    from app.models.role import Role
    from app.models.utilisateur import Utilisateur


class Entreprise(Base, TimestampMixin):
    __tablename__ = "entreprises"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    # Type d'activité : générique par défaut, "telephonie" active les champs IMEI/série
    secteur: Mapped[str] = mapped_column(String(50), default="generique", nullable=False)
    devise: Mapped[str] = mapped_column(String(10), default="DA", nullable=False)
    telephone: Mapped[str | None] = mapped_column(String(50))
    adresse: Mapped[str | None] = mapped_column(String(500))

    magasins: Mapped[list["Magasin"]] = relationship(
        back_populates="entreprise", cascade="all, delete-orphan"
    )
    utilisateurs: Mapped[list["Utilisateur"]] = relationship(
        back_populates="entreprise", cascade="all, delete-orphan"
    )
    roles: Mapped[list["Role"]] = relationship(
        back_populates="entreprise", cascade="all, delete-orphan"
    )
