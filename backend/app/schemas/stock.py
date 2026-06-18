"""Schémas Pydantic pour le stock, les mouvements et l'inventaire."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class KpisStock(BaseModel):
    nb_articles: int
    disponible: int
    rupture: int
    alerte: int
    valeur_stock: Decimal


class MouvementCreate(BaseModel):
    article_id: int
    type: str = Field(description="entree | sortie | ajustement | transfert")
    quantite: Decimal
    cout_unitaire: Decimal | None = Field(default=None, ge=0)
    motif: str | None = Field(default=None, max_length=255)
    note: str | None = None
    magasin_destination_id: int | None = None


class MouvementOut(BaseModel):
    id: int
    article_id: int
    article_designation: str | None = None
    magasin_id: int
    magasin_destination_id: int | None = None
    type: str
    quantite: Decimal
    cout_unitaire: Decimal | None = None
    motif: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class StockLigneOut(BaseModel):
    article_id: int
    reference: str
    designation: str
    quantite: Decimal
    seuil_alerte: Decimal
    prix_achat_moyen: Decimal
    prix_vente: Decimal

    model_config = {"from_attributes": True}


# --- Inventaire --------------------------------------------------------------
class InventaireLigneIn(BaseModel):
    article_id: int
    quantite_comptee: Decimal = Field(ge=0)


class InventaireCreate(BaseModel):
    note: str | None = Field(default=None, max_length=255)
    lignes: list[InventaireLigneIn] = []


class InventaireLigneOut(BaseModel):
    id: int
    article_id: int
    article_designation: str | None = None
    quantite_theorique: Decimal
    quantite_comptee: Decimal
    ecart: Decimal

    model_config = {"from_attributes": True}


class InventaireOut(BaseModel):
    id: int
    reference: str
    magasin_id: int
    statut: str
    note: str | None = None
    created_at: datetime
    lignes: list[InventaireLigneOut] = []

    model_config = {"from_attributes": True}
