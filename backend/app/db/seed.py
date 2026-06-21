"""Jeu de données de démonstration complet pour AD-PHONE."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import DEFAULT_ROLES
from app.core.security import hacher_mot_de_passe
from app.models.achat import Achat, AchatLigne, PaiementAchat, ACH_RECUE
from app.models.catalogue import Article, Famille, Marque, Taxe, Unite
from app.models.entreprise import Entreprise
from app.models.magasin import Magasin
from app.models.role import Role
from app.models.stock import ENTREE
from app.models.tiers import TIERS_CLIENT, TIERS_FOURNISSEUR, Tiers
from app.models.utilisateur import Utilisateur
from app.models.vente import Vente, VenteLigne, PaiementVente, VTE_FACTURE, VEN_VALIDEE
from app.services import stock as svc

DEMO_EMAIL = "admin@demo.dz"
DEMO_PASSWORD = "admin123"

D = Decimal
NOW = datetime.now(timezone.utc)


def _ago(days: int) -> datetime:
    return NOW - timedelta(days=days)


def init_demo(db: Session) -> None:
    if db.scalar(select(Utilisateur).where(Utilisateur.email == DEMO_EMAIL)):
        return

    entreprise = Entreprise(
        nom="AD-PHONE ALGERIE", secteur="telephonie", devise="DA",
        telephone="+213 21 00 00 00", adresse="Alger, Algérie",
    )
    db.add(entreprise)
    db.flush()
    eid = entreprise.id

    magasin = Magasin(entreprise_id=eid, nom="Magasin principal", adresse="Alger Centre", est_principal=True)
    db.add(magasin)
    db.flush()
    mid = magasin.id

    roles: dict[str, Role] = {}
    for nom, cfg in DEFAULT_ROLES.items():
        r = Role(entreprise_id=eid, nom=nom, description=cfg["description"], permissions=cfg["permissions"])
        db.add(r)
        roles[nom] = r
    db.flush()

    admin = Utilisateur(
        entreprise_id=eid, role_id=roles["Administrateur"].id, magasin_id=mid,
        nom="Administrateur", email=DEMO_EMAIL,
        mot_de_passe_hash=hacher_mot_de_passe(DEMO_PASSWORD),
    )
    operateur = Utilisateur(
        entreprise_id=eid, role_id=roles["Vendeur"].id, magasin_id=mid,
        nom="Karim Operateur", email="karim@adphone.dz",
        mot_de_passe_hash=hacher_mot_de_passe("1234"),
    )
    db.add_all([admin, operateur])
    db.flush()
    aid = admin.id

    # --- Référentiels ---
    familles = {n: Famille(entreprise_id=eid, nom=n) for n in [
        "Écrans", "Batteries", "Coques & Protections", "Chargeurs & Câbles", "Accessoires", "Téléphones"
    ]}
    marques = {n: Marque(entreprise_id=eid, nom=n) for n in [
        "Samsung", "Apple", "Xiaomi", "Huawei", "Oppo", "Générique"
    ]}
    unite = Unite(entreprise_id=eid, nom="Pièce", abreviation="pc")
    taxe = Taxe(entreprise_id=eid, nom="TVA 19%", taux=D("19"))
    db.add_all([*familles.values(), *marques.values(), unite, taxe])
    db.flush()

    # --- Fournisseurs ---
    fournisseurs = {}
    for nom, tel, adr in [
        ("TechParts Import", "+213 555 11 22 33", "Alger"),
        ("Mobile Pièces Gros", "+213 555 44 55 66", "Oran"),
        ("China Express SARL", "+213 555 77 88 99", "Sétif"),
        ("LCD World", "+213 555 33 44 55", "Constantine"),
    ]:
        t = Tiers(entreprise_id=eid, type=TIERS_FOURNISSEUR, nom=nom, telephone=tel, adresse=adr)
        db.add(t)
        fournisseurs[nom] = t

    # --- Clients ---
    clients = {}
    for nom, tel, adr in [
        ("Client comptoir", "+213 660 00 00 00", None),
        ("Boutique Réparation Centre", "+213 661 22 33 44", "Alger"),
        ("GSM Blida", "+213 662 55 66 77", "Blida"),
        ("Phone House Oran", "+213 663 88 99 00", "Oran"),
        ("Réparation Express", "+213 664 11 22 33", "Tizi Ouzou"),
        ("MobiTech", "+213 665 44 55 66", "Béjaïa"),
        ("RISGOO Djamel", "+213 666 77 88 99", "Alger"),
    ]:
        t = Tiers(entreprise_id=eid, type=TIERS_CLIENT, nom=nom, telephone=tel, adresse=adr)
        db.add(t)
        clients[nom] = t
    db.flush()

    # --- Articles ---
    catalogue = [
        ("ECR-IP11", "Écran iPhone 11", "Écrans", "Apple", 8500, 13000, 3, True, 15),
        ("ECR-IP12", "Écran iPhone 12", "Écrans", "Apple", 11000, 17000, 3, True, 8),
        ("ECR-IP13", "Écran iPhone 13", "Écrans", "Apple", 14000, 22000, 2, True, 5),
        ("ECR-A12", "Écran Samsung A12", "Écrans", "Samsung", 4200, 7000, 3, True, 10),
        ("ECR-A52", "Écran Samsung A52", "Écrans", "Samsung", 7500, 12000, 3, True, 6),
        ("ECR-S21", "Écran Samsung S21", "Écrans", "Samsung", 15000, 24000, 2, True, 3),
        ("ECR-XR9", "Écran Xiaomi Redmi 9", "Écrans", "Xiaomi", 3200, 5500, 5, True, 12),
        ("ECR-HW-P30", "Écran Huawei P30", "Écrans", "Huawei", 6000, 10000, 3, True, 4),
        ("BAT-IP11", "Batterie iPhone 11", "Batteries", "Apple", 1800, 3500, 5, False, 20),
        ("BAT-IP12", "Batterie iPhone 12", "Batteries", "Apple", 2200, 4000, 5, False, 15),
        ("BAT-A12", "Batterie Samsung A12", "Batteries", "Samsung", 1200, 2500, 8, False, 30),
        ("BAT-A52", "Batterie Samsung A52", "Batteries", "Samsung", 1500, 3000, 5, False, 18),
        ("BAT-XR9", "Batterie Xiaomi Redmi 9", "Batteries", "Xiaomi", 900, 1800, 10, False, 25),
        ("COQ-IP11", "Coque silicone iPhone 11", "Coques & Protections", "Apple", 200, 800, 15, False, 50),
        ("COQ-A12", "Coque silicone Samsung A12", "Coques & Protections", "Samsung", 150, 600, 15, False, 60),
        ("COQ-XR-NOTE10", "Coque silicone Xiaomi Note 10", "Coques & Protections", "Xiaomi", 150, 600, 10, False, 40),
        ("VTR-UNIV", "Verre trempé universel", "Coques & Protections", "Générique", 80, 350, 30, False, 200),
        ("VTR-IP", "Verre trempé iPhone", "Coques & Protections", "Apple", 120, 500, 20, False, 100),
        ("CHG-USBC-25W", "Chargeur USB-C 25W", "Chargeurs & Câbles", "Générique", 600, 1500, 10, False, 35),
        ("CHG-USBC-65W", "Chargeur USB-C 65W rapide", "Chargeurs & Câbles", "Générique", 1200, 2800, 5, False, 15),
        ("CAB-LIGHT", "Câble Lightning 1m", "Chargeurs & Câbles", "Apple", 350, 900, 15, False, 40),
        ("CAB-USBC", "Câble USB-C 1m", "Chargeurs & Câbles", "Générique", 150, 450, 20, False, 60),
        ("ECO-BT", "Écouteurs Bluetooth", "Accessoires", "Générique", 1100, 2600, 8, False, 20),
        ("ECO-AIR", "Écouteurs AirPods style", "Accessoires", "Générique", 2500, 5500, 5, False, 10),
        ("SUP-VOITURE", "Support voiture magnétique", "Accessoires", "Générique", 300, 900, 10, False, 30),
        ("POW-10K", "PowerBank 10000mAh", "Accessoires", "Générique", 1500, 3200, 5, False, 12),
        ("POW-20K", "PowerBank 20000mAh", "Accessoires", "Générique", 2500, 5000, 3, False, 8),
        ("TEL-IP11-REC", "iPhone 11 reconditionné", "Téléphones", "Apple", 35000, 48000, 1, True, 3),
        ("TEL-A12-NEUF", "Samsung A12 neuf", "Téléphones", "Samsung", 22000, 28000, 2, True, 5),
        ("TEL-XR-NOTE11", "Xiaomi Redmi Note 11", "Téléphones", "Xiaomi", 18000, 24000, 2, True, 4),
    ]

    articles_par_ref: dict[str, Article] = {}
    for ref, design, fam, mar, pa, pv, seuil, serie, qte in catalogue:
        a = Article(
            entreprise_id=eid, reference=ref, designation=design,
            famille_id=familles[fam].id, marque_id=marques[mar].id,
            unite_id=unite.id, taxe_id=taxe.id,
            prix_achat_moyen=D("0"), prix_vente=D(pv),
            prix_vente_gros=D(int(pv * 0.85)), prix_vente_super_gros=D(int(pv * 0.75)),
            seuil_alerte=D(seuil), suivi_serie=serie,
        )
        db.add(a)
        db.flush()
        articles_par_ref[ref] = a
        if qte > 0:
            svc.appliquer_mouvement(
                db, entreprise_id=eid, article=a, magasin_id=mid,
                type_mouvement=ENTREE, quantite=D(qte), cout_unitaire=D(pa),
                motif="Stock initial", cree_par_id=aid,
            )

    # --- Achats de démonstration ---
    achats_demo = [
        ("TechParts Import", 25, [("ECR-IP11", 5, 8500), ("ECR-IP12", 3, 11000), ("BAT-IP11", 10, 1800)], 80000, True),
        ("Mobile Pièces Gros", 20, [("ECR-A12", 8, 4200), ("BAT-A12", 20, 1200), ("COQ-A12", 30, 150)], 40000, True),
        ("China Express SARL", 15, [("VTR-UNIV", 100, 80), ("CHG-USBC-25W", 20, 600), ("CAB-USBC", 30, 150)], 15000, False),
        ("LCD World", 10, [("ECR-S21", 2, 15000), ("ECR-HW-P30", 3, 6000)], 30000, True),
        ("TechParts Import", 5, [("TEL-IP11-REC", 2, 35000), ("ECO-AIR", 5, 2500)], 50000, False),
    ]

    for four_nom, days_ago, lignes, paiement, paid_full in achats_demo:
        achat = Achat(
            entreprise_id=eid, magasin_id=mid,
            fournisseur_id=fournisseurs[four_nom].id,
            reference=f"BA-{len(achats_demo)}-{days_ago:02d}",
            statut=ACH_RECUE,
            date_reception=_ago(days_ago),
            cree_par_id=aid,
        )
        db.add(achat)
        db.flush()
        achat.reference = f"BA-{achat.id:04d}"

        for ref, qty, cout in lignes:
            art = articles_par_ref[ref]
            db.add(AchatLigne(achat_id=achat.id, article_id=art.id, quantite=D(qty), cout_unitaire=D(cout)))
            svc.appliquer_mouvement(
                db, entreprise_id=eid, article=art, magasin_id=mid,
                type_mouvement=ENTREE, quantite=D(qty), cout_unitaire=D(cout),
                motif=f"Achat {achat.reference}", cree_par_id=aid,
            )

        db.flush()
        mt = achat.montant_total
        if paid_full:
            db.add(PaiementAchat(achat_id=achat.id, montant=mt, methode="virement"))
        elif paiement > 0:
            db.add(PaiementAchat(achat_id=achat.id, montant=D(paiement), methode="espèces"))

    # --- Ventes de démonstration ---
    ventes_demo = [
        ("Boutique Réparation Centre", 28, [("ECR-IP11", 2, 13000), ("BAT-IP11", 3, 3500), ("VTR-UNIV", 10, 350)], 40000, True),
        ("GSM Blida", 25, [("ECR-A12", 3, 7000), ("ECR-A52", 2, 12000), ("COQ-A12", 10, 600)], 45000, True),
        ("Phone House Oran", 22, [("ECR-IP12", 2, 17000), ("BAT-IP12", 5, 4000), ("CAB-LIGHT", 10, 900)], 50000, False),
        ("Client comptoir", 20, [("CHG-USBC-25W", 2, 1500), ("VTR-UNIV", 5, 350)], None, True),
        ("Réparation Express", 18, [("ECR-XR9", 4, 5500), ("BAT-XR9", 6, 1800), ("COQ-XR-NOTE10", 5, 600)], 25000, False),
        ("MobiTech", 15, [("ECR-S21", 1, 24000), ("ECR-HW-P30", 2, 10000), ("ECO-BT", 3, 2600)], 40000, True),
        ("RISGOO Djamel", 12, [("ECR-IP13", 2, 22000), ("BAT-IP11", 5, 3500), ("VTR-IP", 20, 500)], 50000, False),
        ("Client comptoir", 10, [("CAB-USBC", 3, 450), ("SUP-VOITURE", 2, 900)], None, True),
        ("Boutique Réparation Centre", 8, [("ECR-A12", 2, 7000), ("BAT-A12", 5, 2500), ("CHG-USBC-65W", 2, 2800)], 25000, True),
        ("GSM Blida", 5, [("TEL-A12-NEUF", 2, 28000), ("ECO-AIR", 2, 5500)], 50000, False),
        ("Phone House Oran", 3, [("TEL-XR-NOTE11", 1, 24000), ("POW-10K", 3, 3200), ("POW-20K", 2, 5000)], 30000, False),
        ("Client comptoir", 1, [("VTR-UNIV", 3, 350), ("COQ-IP11", 2, 800)], None, True),
    ]

    for cli_nom, days_ago, lignes, paiement, paid_full in ventes_demo:
        vente = Vente(
            entreprise_id=eid, magasin_id=mid,
            client_id=clients[cli_nom].id,
            reference=f"FV-TEMP",
            type=VTE_FACTURE, statut=VEN_VALIDEE,
            date_validation=_ago(days_ago),
            cree_par_id=aid,
        )
        db.add(vente)
        db.flush()
        vente.reference = f"FV-{vente.id:04d}"

        for ref, qty, prix in lignes:
            art = articles_par_ref[ref]
            db.add(VenteLigne(
                vente_id=vente.id, article_id=art.id,
                quantite=D(qty), prix_unitaire=D(prix),
                cout_unitaire=art.prix_achat_moyen,
            ))
            svc.appliquer_mouvement(
                db, entreprise_id=eid, article=art, magasin_id=mid,
                type_mouvement="sortie", quantite=D(qty),
                motif=f"Vente {vente.reference}", cree_par_id=aid,
            )

        db.flush()
        mt = vente.montant_total
        if paid_full:
            db.add(PaiementVente(vente_id=vente.id, montant=mt, methode="espèces"))
        elif paiement and paiement > 0:
            db.add(PaiementVente(vente_id=vente.id, montant=D(paiement), methode="espèces"))

    db.commit()
