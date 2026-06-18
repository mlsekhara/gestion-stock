"""Modèle Role — regroupe un ensemble de permissions (droits d'accès)."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

# JSONB sur PostgreSQL, JSON générique ailleurs (ex. SQLite pour les tests)
PermissionsType = JSON().with_variant(JSONB(), "postgresql")

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.entreprise import Entreprise
    from app.models.utilisateur import Utilisateur


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    # Liste de clés de permission ; ["*"] = tous les droits
    permissions: Mapped[list[str]] = mapped_column(PermissionsType, default=list, nullable=False)

    entreprise: Mapped["Entreprise"] = relationship(back_populates="roles")
    utilisateurs: Mapped[list["Utilisateur"]] = relationship(back_populates="role")
