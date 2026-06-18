"""Tests Phase 1 : catalogue, mouvements de stock, KPIs, inventaire."""
from app.db.seed import DEMO_EMAIL, DEMO_PASSWORD


def _auth(client, email=DEMO_EMAIL, password=DEMO_PASSWORD):
    tokens = client.post("/api/auth/login", data={"username": email, "password": password}).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_kpis_refletent_le_seed(client, demo):
    h = _auth(client)
    r = client.get("/api/stock/kpis", headers=h)
    assert r.status_code == 200
    k = r.json()
    assert k["nb_articles"] == 9
    assert k["rupture"] == 1          # BAT-IP11 (qte 0)
    assert k["alerte"] == 3           # ECR-A12, CAB-LIGHT, ECO-BT
    assert k["disponible"] == 8
    assert float(k["valeur_stock"]) > 0


def test_creation_article_et_mouvements(client, demo):
    h = _auth(client)
    # crée un article
    r = client.post("/api/articles", headers=h, json={
        "reference": "TEST-1", "designation": "Article test", "prix_vente": 1000, "seuil_alerte": 5,
    })
    assert r.status_code == 201, r.text
    aid = r.json()["id"]
    assert float(r.json()["quantite"]) == 0

    # entrée de 10 à 100 DA -> stock 10, prix moyen 100
    r = client.post("/api/stock/mouvements", headers=h, json={
        "article_id": aid, "type": "entree", "quantite": 10, "cout_unitaire": 100,
    })
    assert r.status_code == 201, r.text

    # 2e entrée de 10 à 200 DA -> prix moyen 150
    client.post("/api/stock/mouvements", headers=h, json={
        "article_id": aid, "type": "entree", "quantite": 10, "cout_unitaire": 200,
    })
    detail = client.get(f"/api/articles/{aid}", headers=h).json()
    assert float(detail["quantite"]) == 20
    assert float(detail["prix_achat_moyen"]) == 150

    # sortie de 5 -> stock 15
    r = client.post("/api/stock/mouvements", headers=h, json={"article_id": aid, "type": "sortie", "quantite": 5})
    assert r.status_code == 201
    assert float(client.get(f"/api/articles/{aid}", headers=h).json()["quantite"]) == 15

    # sortie excessive -> 400
    r = client.post("/api/stock/mouvements", headers=h, json={"article_id": aid, "type": "sortie", "quantite": 999})
    assert r.status_code == 400


def test_reference_dupliquee_refusee(client, demo):
    h = _auth(client)
    payload = {"reference": "DUP-1", "designation": "Doublon", "prix_vente": 10}
    assert client.post("/api/articles", headers=h, json=payload).status_code == 201
    assert client.post("/api/articles", headers=h, json=payload).status_code == 409


def test_inventaire_genere_ajustement(client, demo):
    h = _auth(client)
    aid = client.post("/api/articles", headers=h, json={
        "reference": "INV-ART", "designation": "Article inventaire", "prix_vente": 100,
    }).json()["id"]
    client.post("/api/stock/mouvements", headers=h, json={
        "article_id": aid, "type": "entree", "quantite": 10, "cout_unitaire": 50,
    })
    # inventaire : on compte 7 (au lieu de 10)
    inv = client.post("/api/stock/inventaires", headers=h, json={
        "note": "Comptage test", "lignes": [{"article_id": aid, "quantite_comptee": 7}],
    }).json()
    assert inv["statut"] == "brouillon"
    assert float(inv["lignes"][0]["ecart"]) == -3

    r = client.post(f"/api/stock/inventaires/{inv['id']}/valider", headers=h)
    assert r.status_code == 200
    assert r.json()["statut"] == "valide"
    # le stock est ajusté à 7
    assert float(client.get(f"/api/articles/{aid}", headers=h).json()["quantite"]) == 7


def test_referentiel_famille_crud(client, demo):
    h = _auth(client)
    r = client.post("/api/familles", headers=h, json={"nom": "Nouvelle famille"})
    assert r.status_code == 201
    fid = r.json()["id"]
    # doublon -> 409
    assert client.post("/api/familles", headers=h, json={"nom": "Nouvelle famille"}).status_code == 409
    assert client.delete(f"/api/familles/{fid}", headers=h).status_code == 204
