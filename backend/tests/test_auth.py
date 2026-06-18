"""Tests d'authentification et d'isolation multi-tenant (Phase 0)."""
from app.core.security import hacher_mot_de_passe
from app.db.seed import DEMO_EMAIL, DEMO_PASSWORD
from app.models.entreprise import Entreprise
from app.models.magasin import Magasin
from app.models.role import Role
from app.models.utilisateur import Utilisateur


def _login(client, email, password):
    return client.post("/api/auth/login", data={"username": email, "password": password})


def test_login_reussi_et_profil(client, demo):
    resp = _login(client, DEMO_EMAIL, DEMO_PASSWORD)
    assert resp.status_code == 200
    tokens = resp.json()
    assert tokens["token_type"] == "bearer"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.status_code == 200
    data = me.json()
    assert data["email"] == DEMO_EMAIL
    assert data["role"] == "Administrateur"
    assert "*" in data["permissions"]
    assert data["entreprise"]["nom"] == "AD-PHONE ALGERIE"
    assert len(data["magasins"]) == 1


def test_login_mauvais_mot_de_passe(client, demo):
    resp = _login(client, DEMO_EMAIL, "mauvais")
    assert resp.status_code == 401


def test_refresh_token(client, demo):
    tokens = _login(client, DEMO_EMAIL, DEMO_PASSWORD).json()
    resp = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_acces_refuse_sans_jeton(client, demo):
    assert client.get("/api/auth/me").status_code == 401


def test_isolation_multi_tenant(client, db_session):
    """Le profil ne renvoie que les magasins de l'entreprise de l'utilisateur."""
    # Entreprise A avec son magasin + admin
    init_two_tenants(db_session)

    tokens = _login(client, "a@a.dz", "passe123").json()
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    magasins = me.json()["magasins"]
    assert len(magasins) == 1
    assert magasins[0]["nom"] == "Magasin A"


def init_two_tenants(db):
    for suffixe, email in (("A", "a@a.dz"), ("B", "b@b.dz")):
        ent = Entreprise(nom=f"Entreprise {suffixe}", secteur="generique", devise="DA")
        db.add(ent)
        db.flush()
        mag = Magasin(entreprise_id=ent.id, nom=f"Magasin {suffixe}", est_principal=True)
        role = Role(entreprise_id=ent.id, nom="Administrateur", permissions=["*"])
        db.add_all([mag, role])
        db.flush()
        db.add(Utilisateur(
            entreprise_id=ent.id, role_id=role.id, magasin_id=mag.id,
            nom=f"Admin {suffixe}", email=email,
            mot_de_passe_hash=hacher_mot_de_passe("passe123"),
        ))
    db.commit()
