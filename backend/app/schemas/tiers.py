"""Schémas Pydantic pour les tiers (fournisseurs / clients)."""
from pydantic import BaseModel, Field


class TiersBase(BaseModel):
    nom: str = Field(min_length=1, max_length=255)
    telephone: str | None = None
    email: str | None = None
    adresse: str | None = None
    rc: str | None = None
    nif: str | None = None
    actif: bool = True


class TiersCreate(TiersBase):
    pass


class TiersUpdate(BaseModel):
    nom: str | None = Field(default=None, min_length=1, max_length=255)
    telephone: str | None = None
    email: str | None = None
    adresse: str | None = None
    rc: str | None = None
    nif: str | None = None
    actif: bool | None = None


class TiersOut(TiersBase):
    id: int
    type: str
    model_config = {"from_attributes": True}
