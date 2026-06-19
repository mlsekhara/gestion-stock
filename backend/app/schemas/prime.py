"""Schémas Pydantic pour le système de primes."""
from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class PrimeConfigCreate(BaseModel):
    utilisateur_id: int
    taux_ca: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    taux_recouvrement: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    periodicite: str = "mensuelle"


class PrimeConfigUpdate(BaseModel):
    taux_ca: Decimal | None = Field(default=None, ge=0, le=100)
    taux_recouvrement: Decimal | None = Field(default=None, ge=0, le=100)
    periodicite: str | None = None


class PrimeConfigOut(BaseModel):
    id: int
    utilisateur_id: int
    utilisateur_nom: str | None = None
    taux_ca: Decimal
    taux_recouvrement: Decimal
    periodicite: str

    model_config = {"from_attributes": True}


class PrimeBilanAdmin(BaseModel):
    """Vue admin : détail complet par opérateur."""
    utilisateur_id: int
    utilisateur_nom: str
    taux_ca: Decimal
    taux_recouvrement: Decimal
    periodicite: str
    ca_realise: Decimal
    recouvrement_realise: Decimal
    prime_ca: Decimal
    prime_recouvrement: Decimal
    prime_totale: Decimal
    date_debut: str
    date_fin: str


class PrimeBilanOperateur(BaseModel):
    """Vue opérateur : montant de prime seulement, sans CA."""
    utilisateur_nom: str
    taux_ca: Decimal
    taux_recouvrement: Decimal
    periodicite: str
    prime_ca: Decimal
    prime_recouvrement: Decimal
    prime_totale: Decimal
    date_debut: str
    date_fin: str
