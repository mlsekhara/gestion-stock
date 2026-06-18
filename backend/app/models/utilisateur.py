"""Modèle Utilisateur — rattaché à une entreprise, un rôle et un magasin par défaut."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.entreprise import Entreprise
    from app.models.magasin import Magasin
    from app.models.role import Role


class Utilisateur(Base, TimestampMixin):
    __tablename__ = "utilisateurs"
    __table_args__ = (
        UniqueConstraint("entreprise_id", "email", name="uq_utilisateur_email_entreprise"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id", ondelete="SET NULL"))
    magasin_id: Mapped[int | None] = mapped_column(ForeignKey("magasins.id", ondelete="SET NULL"))

    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    mot_de_passe_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    entreprise: Mapped["Entreprise"] = relationship(back_populates="utilisateurs")
    role: Mapped["Role | None"] = relationship(back_populates="utilisateurs")
    magasin: Mapped["Magasin | None"] = relationship()

    @property
    def permissions(self) -> list[str]:
        return self.role.permissions if self.role else []
