"""Schémas Pydantic pour les ventes."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class VenteLigneIn(BaseModel):
    article_id: int
    quantite: Decimal = Field(gt=0)
    prix_unitaire: Decimal = Field(ge=0)


class VenteCreate(BaseModel):
    client_id: int | None = None
    type: str = Field(default="facture", description="facture | proforma | retour")
    note: str | None = Field(default=None, max_length=255)
    echeance: datetime | None = None
    lignes: list[VenteLigneIn] = Field(min_length=1)


class VenteLigneOut(BaseModel):
    id: int
    article_id: int
    article_designation: str | None = None
    quantite: Decimal
    prix_unitaire: Decimal
    cout_unitaire: Decimal | None = None
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


class VenteOut(BaseModel):
    id: int
    reference: str
    type: str
    statut: str
    magasin_id: int
    client_id: int | None = None
    client_nom: str | None = None
    note: str | None = None
    echeance: datetime | None = None
    date_validation: datetime | None = None
    created_at: datetime
    montant_total: Decimal
    montant_paye: Decimal
    reste_a_payer: Decimal
    marge_totale: Decimal
    lignes: list[VenteLigneOut] = []
    paiements: list[PaiementOut] = []


class KpisVentes(BaseModel):
    nb_ventes: int
    chiffre_affaires: Decimal
    marge: Decimal
    panier_moyen: Decimal
