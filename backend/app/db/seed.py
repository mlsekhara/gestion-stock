"""Jeu de données de démonstration : entreprise + magasin + rôles + admin + catalogue."""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import DEFAULT_ROLES
from app.core.security import hacher_mot_de_passe
from app.models.catalogue import Article, Famille, Marque, Taxe, Unite
from app.models.entreprise import Entreprise
from app.models.magasin import Magasin
from app.models.role import Role
from app.models.stock import ENTREE
from app.models.tiers import TIERS_CLIENT, TIERS_FOURNISSEUR, Tiers
from app.models.utilisateur import Utilisateur
from app.services import stock as svc

DEMO_EMAIL = "admin@demo.dz"
DEMO_PASSWORD = "admin123"


def init_demo(db: Session) -> None:
    """Crée le jeu de démo s'il n'existe pas déjà (idempotent)."""
    if db.scalar(select(Utilisateur).where(Utilisateur.email == DEMO_EMAIL)):
        return

    entreprise = Entreprise(
        nom="AD-PHONE ALGERIE",
        secteur="telephonie",
        devise="DA",
        telephone="+213 21 00 00 00",
        adresse="Alger, Algérie",
    )
    db.add(entreprise)
    db.flush()

    magasin = Magasin(
        entreprise_id=entreprise.id,
        nom="Magasin principal",
        adresse="Alger Centre",
        est_principal=True,
    )
    db.add(magasin)

    roles_par_nom: dict[str, Role] = {}
    for nom, cfg in DEFAULT_ROLES.items():
        role = Role(
            entreprise_id=entreprise.id,
            nom=nom,
            description=cfg["description"],
            permissions=cfg["permissions"],
        )
        db.add(role)
        roles_par_nom[nom] = role
    db.flush()

    admin = Utilisateur(
        entreprise_id=entreprise.id,
        role_id=roles_par_nom["Administrateur"].id,
        magasin_id=magasin.id,
        nom="Administrateur",
        email=DEMO_EMAIL,
        mot_de_passe_hash=hacher_mot_de_passe(DEMO_PASSWORD),
    )
    db.add(admin)
    db.flush()

    _seed_catalogue(db, entreprise.id, magasin.id, admin.id)
    db.commit()


def _seed_catalogue(db: Session, entreprise_id: int, magasin_id: int, admin_id: int) -> None:
    """Référentiels + articles de démonstration (téléphonie) + stock initial."""
    familles = {
        nom: Famille(entreprise_id=entreprise_id, nom=nom)
        for nom in ["Écrans", "Batteries", "Coques & Protections", "Chargeurs & Câbles", "Accessoires"]
    }
    marques = {
        nom: Marque(entreprise_id=entreprise_id, nom=nom)
        for nom in ["Samsung", "Apple", "Xiaomi", "Générique"]
    }
    unite = Unite(entreprise_id=entreprise_id, nom="Pièce", abreviation="pc")
    taxe = Taxe(entreprise_id=entreprise_id, nom="TVA 19%", taux=Decimal("19"))
    db.add_all([*familles.values(), *marques.values(), unite, taxe])
    db.add_all([
        Tiers(entreprise_id=entreprise_id, type=TIERS_FOURNISSEUR, nom="TechParts Import",
              telephone="+213 555 11 22 33", adresse="Alger"),
        Tiers(entreprise_id=entreprise_id, type=TIERS_FOURNISSEUR, nom="Mobile Pièces Gros",
              telephone="+213 555 44 55 66", adresse="Oran"),
        Tiers(entreprise_id=entreprise_id, type=TIERS_CLIENT, nom="Client comptoir",
              telephone="+213 660 00 00 00"),
        Tiers(entreprise_id=entreprise_id, type=TIERS_CLIENT, nom="Boutique Reparation Centre",
              telephone="+213 661 22 33 44", adresse="Alger"),
    ])
    db.flush()

    # (référence, désignation, famille, marque, prix_achat, prix_vente, seuil, suivi_serie, qte_initiale)
    catalogue = [
        ("ECR-IP11", "Écran iPhone 11", "Écrans", "Apple", 8500, 13000, 3, True, 12),
        ("ECR-A12", "Écran Samsung A12", "Écrans", "Samsung", 4200, 7000, 3, True, 2),
        ("BAT-A12", "Batterie Samsung A12", "Batteries", "Samsung", 1200, 2500, 5, False, 25),
        ("BAT-IP11", "Batterie iPhone 11", "Batteries", "Apple", 1800, 3500, 5, False, 0),
        ("COQ-XR-NOTE10", "Coque silicone Xiaomi Redmi Note 10", "Coques & Protections", "Xiaomi", 150, 600, 10, False, 60),
        ("CHG-USBC-25W", "Chargeur USB-C 25W", "Chargeurs & Câbles", "Générique", 600, 1500, 8, False, 40),
        ("CAB-LIGHT", "Câble Lightning 1m", "Chargeurs & Câbles", "Apple", 350, 900, 10, False, 4),
        ("VTR-UNIV", "Verre trempé universel", "Coques & Protections", "Générique", 80, 350, 20, False, 120),
        ("ECO-BT", "Écouteurs Bluetooth", "Accessoires", "Générique", 1100, 2600, 6, False, 1),
    ]
    for ref, design, fam, mar, pa, pv, seuil, serie, qte in catalogue:
        article = Article(
            entreprise_id=entreprise_id, reference=ref, designation=design,
            famille_id=familles[fam].id, marque_id=marques[mar].id, unite_id=unite.id, taxe_id=taxe.id,
            prix_achat_moyen=Decimal("0"), prix_vente=Decimal(pv),
            seuil_alerte=Decimal(seuil), suivi_serie=serie,
        )
        db.add(article)
        db.flush()
        if qte > 0:
            svc.appliquer_mouvement(
                db, entreprise_id=entreprise_id, article=article, magasin_id=magasin_id,
                type_mouvement=ENTREE, quantite=Decimal(qte), cout_unitaire=Decimal(pa),
                motif="Stock initial", cree_par_id=admin_id,
            )
