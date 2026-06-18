"""Routeur Articles : CRUD, recherche, recherche par code-barres."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission, get_magasin_courant, get_utilisateur_courant
from app.db.session import get_db
from app.models.catalogue import Article, Famille, Marque, Taxe, Unite
from app.models.magasin import Magasin
from app.models.stock import Stock
from app.models.utilisateur import Utilisateur
from app.schemas.catalogue import ArticleCreate, ArticleOut, ArticleUpdate, article_to_out

router = APIRouter(prefix="/articles", tags=["Articles"])

LIRE = exiger_permission("articles:lire")
GERER = exiger_permission("articles:gerer")

_FK_MODELS = {"famille_id": Famille, "marque_id": Marque, "unite_id": Unite, "taxe_id": Taxe}


def _valider_fk(db: Session, entreprise_id: int, data: dict) -> None:
    """Vérifie que les référentiels liés appartiennent à l'entreprise."""
    for champ, model in _FK_MODELS.items():
        val = data.get(champ)
        if val is not None:
            obj = db.get(model, val)
            if obj is None or obj.entreprise_id != entreprise_id:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"{champ} invalide")


def _quantites(db: Session, magasin_id: int, article_ids: list[int]) -> dict[int, Decimal]:
    if not article_ids:
        return {}
    rows = db.execute(
        select(Stock.article_id, Stock.quantite).where(
            Stock.magasin_id == magasin_id, Stock.article_id.in_(article_ids)
        )
    )
    return {aid: q for aid, q in rows}


@router.get("", response_model=list[ArticleOut], summary="Lister / rechercher les articles")
def lister(
    q: str | None = Query(default=None, description="Recherche désignation / référence / code-barres"),
    famille_id: int | None = None,
    actif: bool | None = None,
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    stmt = select(Article).where(Article.entreprise_id == u.entreprise_id)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Article.designation.ilike(like), Article.reference.ilike(like), Article.code_barres.ilike(like))
        )
    if famille_id is not None:
        stmt = stmt.where(Article.famille_id == famille_id)
    if actif is not None:
        stmt = stmt.where(Article.actif.is_(actif))
    stmt = stmt.order_by(Article.designation)
    articles = db.scalars(stmt).all()
    qts = _quantites(db, magasin.id, [a.id for a in articles])
    return [article_to_out(a, qts.get(a.id, Decimal("0"))) for a in articles]


@router.get("/code-barres/{code}", response_model=ArticleOut, summary="Trouver un article par code-barres")
def par_code_barres(
    code: str,
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    article = db.scalar(
        select(Article).where(Article.entreprise_id == u.entreprise_id, Article.code_barres == code)
    )
    if article is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aucun article pour ce code-barres")
    q = db.scalar(select(Stock.quantite).where(Stock.article_id == article.id, Stock.magasin_id == magasin.id))
    return article_to_out(article, q or Decimal("0"))


@router.get("/{article_id}", response_model=ArticleOut)
def detail(
    article_id: int,
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    article = db.get(Article, article_id)
    if article is None or article.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    q = db.scalar(select(Stock.quantite).where(Stock.article_id == article.id, Stock.magasin_id == magasin.id))
    return article_to_out(article, q or Decimal("0"))


@router.post("", response_model=ArticleOut, status_code=status.HTTP_201_CREATED)
def creer(
    payload: ArticleCreate,
    db: Session = Depends(get_db),
    u: Utilisateur = Depends(GERER),
):
    data = payload.model_dump()
    _valider_fk(db, u.entreprise_id, data)
    article = Article(entreprise_id=u.entreprise_id, **data)
    db.add(article)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Cette référence existe déjà")
    db.refresh(article)
    return article_to_out(article, Decimal("0"))


@router.put("/{article_id}", response_model=ArticleOut)
def modifier(
    article_id: int,
    payload: ArticleUpdate,
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(GERER),
):
    article = db.get(Article, article_id)
    if article is None or article.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    data = payload.model_dump(exclude_unset=True)
    _valider_fk(db, u.entreprise_id, data)
    for k, v in data.items():
        setattr(article, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Cette référence existe déjà")
    db.refresh(article)
    q = db.scalar(select(Stock.quantite).where(Stock.article_id == article.id, Stock.magasin_id == magasin.id))
    return article_to_out(article, q or Decimal("0"))


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(article_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
    article = db.get(Article, article_id)
    if article is None or article.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    db.delete(article)
    db.commit()
