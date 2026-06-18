"""Schémas Pydantic pour les achats."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class AchatLigneIn(BaseModel):
    article_id: int
    quantite: Decimal = Field(gt=0)
    cout_unitaire: Decimal = Field(ge=0)


class AchatCreate(BaseModel):
    fournisseur_id: int | None = None
    note: str | None = Field(default=None, max_length=255)
    echeance: datetime | None = None
    lignes: list[AchatLigneIn] = Field(min_length=1)


class AchatLigneOut(BaseModel):
    id: int
    article_id: int
    article_designation: str | None = None
    quantite: Decimal
    cout_unitaire: Decimal
    montant: Decimal

    model_config = {"from_attributes": True}


class PaiementCreate(BaseModel):
    montant: Decimal = Field(gt=0)
    methode: str = Field(default="espèces", max_length=40)
    note: str | None = None


class PaiementOut(BaseModel):
    id: int
    montant: Decimal
    methode: str
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AchatOut(BaseModel):
    id: int
    reference: str
    statut: str
    magasin_id: int
    fournisseur_id: int | None = None
    fournisseur_nom: str | None = None
    note: str | None = None
    echeance: datetime | None = None
    date_reception: datetime | None = None
    created_at: datetime
    montant_total: Decimal
    montant_paye: Decimal
    reste_a_payer: Decimal
    lignes: list[AchatLigneOut] = []
    paiements: list[PaiementOut] = []
