"""Schémas Pydantic pour les référentiels et les articles."""
from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


# --- Référentiels génériques -------------------------------------------------
class NomCreate(BaseModel):
    nom: str = Field(min_length=1, max_length=120)


class FamilleCreate(NomCreate):
    description: str | None = None


class MarqueCreate(NomCreate):
    pass


class UniteCreate(NomCreate):
    abreviation: str | None = Field(default=None, max_length=12)


class TaxeCreate(NomCreate):
    taux: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class RefOut(BaseModel):
    id: int
    nom: str
    model_config = {"from_attributes": True}


class FamilleOut(RefOut):
    description: str | None = None


class UniteOut(RefOut):
    abreviation: str | None = None


class TaxeOut(RefOut):
    taux: Decimal


# --- Articles ----------------------------------------------------------------
class ArticleBase(BaseModel):
    reference: str | None = Field(default=None, max_length=80)
    code_barres: str | None = Field(default=None, max_length=80)
    designation: str = Field(min_length=1, max_length=255)
    description: str | None = None
    famille_id: int | None = None
    marque_id: int | None = None
    unite_id: int | None = None
    taxe_id: int | None = None
    prix_achat_moyen: Decimal = Field(default=Decimal("0"), ge=0)
    prix_vente: Decimal = Field(default=Decimal("0"), ge=0)
    prix_vente_gros: Decimal = Field(default=Decimal("0"), ge=0)
    prix_vente_super_gros: Decimal = Field(default=Decimal("0"), ge=0)
    seuil_alerte: Decimal = Field(default=Decimal("0"), ge=0)
    suivi_serie: bool = False
    actif: bool = True


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    reference: str | None = Field(default=None, min_length=1, max_length=80)
    code_barres: str | None = None
    designation: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    famille_id: int | None = None
    marque_id: int | None = None
    unite_id: int | None = None
    taxe_id: int | None = None
    prix_achat_moyen: Decimal | None = Field(default=None, ge=0)
    prix_vente: Decimal | None = Field(default=None, ge=0)
    prix_vente_gros: Decimal | None = Field(default=None, ge=0)
    prix_vente_super_gros: Decimal | None = Field(default=None, ge=0)
    seuil_alerte: Decimal | None = Field(default=None, ge=0)
    suivi_serie: bool | None = None
    actif: bool | None = None


class ArticleOut(ArticleBase):
    id: int
    famille_nom: str | None = None
    marque_nom: str | None = None
    unite_abreviation: str | None = None
    taxe_taux: Decimal | None = None
    # Quantité dans le magasin courant (renseignée par l'endpoint)
    quantite: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


def article_to_out(article, quantite: Decimal) -> ArticleOut:
    """Construit la sortie d'un article en aplatissant les relations."""
    return ArticleOut(
        id=article.id,
        reference=article.reference,
        code_barres=article.code_barres,
        designation=article.designation,
        description=article.description,
        famille_id=article.famille_id,
        marque_id=article.marque_id,
        unite_id=article.unite_id,
        taxe_id=article.taxe_id,
        prix_achat_moyen=article.prix_achat_moyen,
        prix_vente=article.prix_vente,
        prix_vente_gros=article.prix_vente_gros,
        prix_vente_super_gros=article.prix_vente_super_gros,
        seuil_alerte=article.seuil_alerte,
        suivi_serie=article.suivi_serie,
        actif=article.actif,
        famille_nom=article.famille.nom if article.famille else None,
        marque_nom=article.marque.nom if article.marque else None,
        unite_abreviation=article.unite.abreviation if article.unite else None,
        taxe_taux=article.taxe.taux if article.taxe else None,
        quantite=quantite,
    )
