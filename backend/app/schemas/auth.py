"""Schémas Pydantic pour l'authentification et l'utilisateur courant."""
from pydantic import BaseModel, EmailStr


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class MagasinResume(BaseModel):
    id: int
    nom: str
    est_principal: bool

    model_config = {"from_attributes": True}


class EntrepriseResume(BaseModel):
    id: int
    nom: str
    secteur: str
    devise: str

    model_config = {"from_attributes": True}


class UtilisateurCourant(BaseModel):
    id: int
    nom: str
    email: EmailStr
    role: str | None = None
    permissions: list[str] = []
    entreprise: EntrepriseResume
    magasin_id: int | None = None
    magasins: list[MagasinResume] = []
