"""Routeur Stock : KPIs, état du stock, mouvements et inventaire."""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import exiger_permission, get_magasin_courant
from app.db.session import get_db
from app.models.catalogue import Article
from app.models.magasin import Magasin
from app.models.stock import (
    Inventaire,
    INV_BROUILLON,
    InventaireLigne,
    MouvementStock,
    Stock,
)
from app.models.utilisateur import Utilisateur
from app.schemas.stock import (
    InventaireCreate,
    InventaireLigneOut,
    InventaireOut,
    KpisStock,
    MouvementCreate,
    MouvementOut,
    StockLigneOut,
)
from app.services import stock as svc

router = APIRouter(prefix="/stock", tags=["Stock"])

LIRE = exiger_permission("stock:lire")
GERER = exiger_permission("stock:gerer")


@router.get("/kpis", response_model=KpisStock, summary="Indicateurs de stock du magasin courant")
def kpis(db: Session = Depends(get_db), magasin: Magasin = Depends(get_magasin_courant), u: Utilisateur = Depends(LIRE)):
    return svc.kpis_stock(db, u.entreprise_id, magasin.id)


@router.get("", response_model=list[StockLigneOut], summary="État du stock du magasin courant")
def etat_stock(
    filtre: str | None = Query(default=None, description="rupture | alerte"),
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    articles = db.scalars(
        select(Article).where(Article.entreprise_id == u.entreprise_id, Article.actif.is_(True)).order_by(Article.designation)
    ).all()
    qts = {
        aid: q
        for aid, q in db.execute(select(Stock.article_id, Stock.quantite).where(Stock.magasin_id == magasin.id))
    }
    lignes = []
    for a in articles:
        q = qts.get(a.id, Decimal("0"))
        if filtre == "rupture" and q > 0:
            continue
        if filtre == "alerte" and not (a.seuil_alerte > 0 and 0 < q <= a.seuil_alerte):
            continue
        lignes.append(
            StockLigneOut(
                article_id=a.id, reference=a.reference, designation=a.designation,
                quantite=q, seuil_alerte=a.seuil_alerte,
                prix_achat_moyen=a.prix_achat_moyen, prix_vente=a.prix_vente,
            )
        )
    return lignes


# --- Mouvements --------------------------------------------------------------
@router.post("/mouvements", response_model=MouvementOut, status_code=status.HTTP_201_CREATED)
def creer_mouvement(
    payload: MouvementCreate,
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(GERER),
):
    article = db.get(Article, payload.article_id)
    if article is None or article.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Article introuvable")

    if payload.magasin_destination_id is not None:
        dest = db.get(Magasin, payload.magasin_destination_id)
        if dest is None or dest.entreprise_id != u.entreprise_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Magasin de destination invalide")

    mouvement = svc.appliquer_mouvement(
        db,
        entreprise_id=u.entreprise_id,
        article=article,
        magasin_id=magasin.id,
        type_mouvement=payload.type,
        quantite=payload.quantite,
        cout_unitaire=payload.cout_unitaire,
        motif=payload.motif,
        note=payload.note,
        magasin_destination_id=payload.magasin_destination_id,
        cree_par_id=u.id,
    )
    db.commit()
    db.refresh(mouvement)
    return MouvementOut(
        id=mouvement.id, article_id=mouvement.article_id, article_designation=article.designation,
        magasin_id=mouvement.magasin_id, magasin_destination_id=mouvement.magasin_destination_id,
        type=mouvement.type, quantite=mouvement.quantite, cout_unitaire=mouvement.cout_unitaire,
        motif=mouvement.motif, created_at=mouvement.created_at,
    )


@router.get("/mouvements", response_model=list[MouvementOut], summary="Derniers mouvements du magasin")
def lister_mouvements(
    limite: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(LIRE),
):
    mouvements = db.scalars(
        select(MouvementStock)
        .where(MouvementStock.entreprise_id == u.entreprise_id, MouvementStock.magasin_id == magasin.id)
        .order_by(MouvementStock.created_at.desc())
        .limit(limite)
    ).all()
    return [
        MouvementOut(
            id=m.id, article_id=m.article_id,
            article_designation=m.article.designation if m.article else None,
            magasin_id=m.magasin_id, magasin_destination_id=m.magasin_destination_id,
            type=m.type, quantite=m.quantite, cout_unitaire=m.cout_unitaire,
            motif=m.motif, created_at=m.created_at,
        )
        for m in mouvements
    ]


# --- Inventaire --------------------------------------------------------------
def _ligne_out(ligne: InventaireLigne) -> InventaireLigneOut:
    return InventaireLigneOut(
        id=ligne.id, article_id=ligne.article_id,
        article_designation=ligne.article.designation if ligne.article else None,
        quantite_theorique=ligne.quantite_theorique, quantite_comptee=ligne.quantite_comptee,
        ecart=ligne.quantite_comptee - ligne.quantite_theorique,
    )


def _inventaire_out(inv: Inventaire) -> InventaireOut:
    return InventaireOut(
        id=inv.id, reference=inv.reference, magasin_id=inv.magasin_id, statut=inv.statut,
        note=inv.note, created_at=inv.created_at, lignes=[_ligne_out(l) for l in inv.lignes],
    )


@router.post("/inventaires", response_model=InventaireOut, status_code=status.HTTP_201_CREATED)
def creer_inventaire(
    payload: InventaireCreate,
    db: Session = Depends(get_db),
    magasin: Magasin = Depends(get_magasin_courant),
    u: Utilisateur = Depends(GERER),
):
    inv = Inventaire(
        entreprise_id=u.entreprise_id, magasin_id=magasin.id,
        reference=svc.prochaine_reference(db, Inventaire, u.entreprise_id, "INV"),
        statut=INV_BROUILLON, note=payload.note, cree_par_id=u.id,
    )
    db.add(inv)
    db.flush()
    for ligne in payload.lignes:
        article = db.get(Article, ligne.article_id)
        if article is None or article.entreprise_id != u.entreprise_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Article invalide dans l'inventaire")
        theorique = svc.quantite_article(db, ligne.article_id, magasin.id)
        db.add(InventaireLigne(
            inventaire_id=inv.id, article_id=ligne.article_id,
            quantite_theorique=theorique, quantite_comptee=ligne.quantite_comptee,
        ))
    db.commit()
    db.refresh(inv)
    return _inventaire_out(inv)


@router.get("/inventaires", response_model=list[InventaireOut])
def lister_inventaires(db: Session = Depends(get_db), magasin: Magasin = Depends(get_magasin_courant), u: Utilisateur = Depends(LIRE)):
    invs = db.scalars(
        select(Inventaire)
        .where(Inventaire.entreprise_id == u.entreprise_id, Inventaire.magasin_id == magasin.id)
        .order_by(Inventaire.created_at.desc())
    ).all()
    return [_inventaire_out(i) for i in invs]


@router.get("/inventaires/{inv_id}", response_model=InventaireOut)
def detail_inventaire(inv_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(LIRE)):
    inv = db.get(Inventaire, inv_id)
    if inv is None or inv.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    return _inventaire_out(inv)


@router.post("/inventaires/{inv_id}/valider", response_model=InventaireOut)
def valider_inventaire(inv_id: int, db: Session = Depends(get_db), u: Utilisateur = Depends(GERER)):
    inv = db.get(Inventaire, inv_id)
    if inv is None or inv.entreprise_id != u.entreprise_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Introuvable")
    svc.valider_inventaire(db, inv, cree_par_id=u.id)
    db.commit()
    db.refresh(inv)
    return _inventaire_out(inv)
