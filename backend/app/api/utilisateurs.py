"""Routeur Utilisateurs : CRUD opérateurs par l'administrateur."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission
from app.core.security import hacher_mot_de_passe
from app.db.session import get_db
from app.models.role import Role
from app.models.utilisateur import Utilisateur

router = APIRouter(prefix="/utilisateurs", tags=["Utilisateurs"])

ADMIN = exiger_permission("parametres:gerer")


class UtilisateurCreate(BaseModel):
    nom: str = Field(min_length=1, max_length=255)
    email: EmailStr
    mot_de_passe: str = Field(min_length=4, max_length=128)
    role_id: int | None = None
    magasin_id: int | None = None
    actif: bool = True


class UtilisateurUpdate(BaseModel):
    nom: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    role_id: int | None = None
    magasin_id: int | None = None
    actif: bool | None = None


class ResetPassword(BaseModel):
    mot_de_passe: str = Field(min_length=4, max_length=128)


class UtilisateurOut(BaseModel):
    id: int
    nom: str
    email: str
    role_id: int | None = None
    role_nom: str | None = None
    magasin_id: int | None = None
    actif: bool

    model_config = {"from_attributes": True}


class RoleOut(BaseModel):
    id: int
    nom: str
    description: str | None = None

    model_config = {"from_attributes": True}


def _user_out(u: Utilisateur) -> UtilisateurOut:
    return UtilisateurOut(
        id=u.id, nom=u.nom, email=u.email,
        role_id=u.role_id, role_nom=u.role.nom if u.role else None,
        magasin_id=u.magasin_id, actif=u.actif,
    )


@router.get("", response_model=list[UtilisateurOut])
def lister(db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    users = db.scalars(
        select(Utilisateur).where(Utilisateur.entreprise_id == u.entreprise_id).order_by(Utilisateur.nom)
    ).all()
    return [_user_out(usr) for usr in users]


@router.post("", response_model=UtilisateurOut, status_code=status.HTTP_201_CREATED)
def creer(payload: UtilisateurCreate, db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    existing = db.scalar(
        select(Utilisateur).where(
            Utilisateur.entreprise_id == u.entreprise_id,
            Utilisateur.email == payload.email,
        )
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Un utilisateur avec cet e-mail existe déjà")
    if payload.role_id:
        role = db.get(Role, payload.role_id)
        if role is None or role.entreprise_id != u.entreprise_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Rôle invalide")
    user = Utilisateur(
        entreprise_id=u.entreprise_id,
        nom=payload.nom,
        email=payload.email,
        mot_de_passe_hash=hacher_mot_de_passe(payload.mot_de_passe),
        role_id=payload.role_id,
        magasin_id=payload.magasin_id,
        actif=payload.actif,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.put("/{user_id}", response_model=UtilisateurOut)
def modifier(user_id: int, payload: UtilisateurUpdate, db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    user = db.get(Utilisateur, user_id)
    if user is None or user.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    if payload.email is not None and payload.email != user.email:
        dup = db.scalar(
            select(Utilisateur).where(
                Utilisateur.entreprise_id == u.entreprise_id,
                Utilisateur.email == payload.email,
                Utilisateur.id != user_id,
            )
        )
        if dup:
            raise HTTPException(status.HTTP_409_CONFLICT, detail="E-mail déjà utilisé")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, val)
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.post("/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(user_id: int, payload: ResetPassword, db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    user = db.get(Utilisateur, user_id)
    if user is None or user.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    user.mot_de_passe_hash = hacher_mot_de_passe(payload.mot_de_passe)
    db.commit()


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(user_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    user = db.get(Utilisateur, user_id)
    if user is None or user.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    if user.id == u.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Impossible de supprimer votre propre compte")
    db.delete(user)
    db.commit()


@router.get("/roles", response_model=list[RoleOut])
def lister_roles(db: Session = Depends(get_db), u: Utilisateur = Depends(ADMIN)):
    roles = db.scalars(
        select(Role).where(Role.entreprise_id == u.entreprise_id).order_by(Role.nom)
    ).all()
    return roles
