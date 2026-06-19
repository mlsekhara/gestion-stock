"""Système de primes : configuration par opérateur et périodes."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class PrimeConfig(Base, TimestampMixin):
    __tablename__ = "prime_configs"
    __table_args__ = (
        UniqueConstraint("entreprise_id", "utilisateur_id", name="uq_prime_config_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    entreprise_id: Mapped[int] = mapped_column(
        ForeignKey("entreprises.id", ondelete="CASCADE"), index=True, nullable=False
    )
    utilisateur_id: Mapped[int] = mapped_column(
        ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    taux_ca: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"), nullable=False)
    taux_recouvrement: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"), nullable=False)
    periodicite: Mapped[str] = mapped_column(String(20), default="mensuelle", nullable=False)

    utilisateur: Mapped["object"] = relationship("Utilisateur", lazy="joined")
