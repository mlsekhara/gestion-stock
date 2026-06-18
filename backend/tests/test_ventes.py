"""Tests Phase 3 : ventes (facture/proforma/retour), marge, stock, paiements, KPIs."""
from app.db.seed import DEMO_EMAIL, DEMO_PASSWORD


def _auth(client):
    tokens = client.post("/api/auth/login", data={"username": DEMO_EMAIL, "password": DEMO_PASSWORD}).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _article_avec_stock(client, h, ref, qte, cout):
    aid = client.post("/api/articles", headers=h, json={"reference": ref, "designation": ref, "prix_vente": 0}).json()["id"]
    client.post("/api/stock/mouvements", headers=h, json={"article_id": aid, "type": "entree", "quantite": qte, "cout_unitaire": cout})
    return aid


def test_facture_decremente_stock_et_calcule_marge(client, demo):
    h = _auth(client)
    aid = _article_avec_stock(client, h, "VTE-1", 20, 100)  # stock 20, prix moyen 100

    r = client.post("/api/ventes", headers=h, json={
        "type": "facture",
        "lignes": [{"article_id": aid, "quantite": 5, "prix_unitaire": 250}],
    })
    assert r.status_code == 201, r.text
    vente = r.json()
    assert vente["statut"] == "brouillon"
    assert float(vente["montant_total"]) == 1250
    vid = vente["id"]

    # stock inchangé tant que non validé
    assert float(client.get(f"/api/articles/{aid}", headers=h).json()["quantite"]) == 20

    r = client.post(f"/api/ventes/{vid}/valider", headers=h)
    assert r.status_code == 200
    v = r.json()
    assert v["statut"] == "validee"
    # marge = (250 - 100) * 5 = 750
    assert float(v["marge_totale"]) == 750
    # stock 20 - 5 = 15
    assert float(client.get(f"/api/articles/{aid}", headers=h).json()["quantite"]) == 15


def test_facture_stock_insuffisant_refusee(client, demo):
    h = _auth(client)
    aid = _article_avec_stock(client, h, "VTE-2", 3, 100)
    vid = client.post("/api/ventes", headers=h, json={
        "type": "facture", "lignes": [{"article_id": aid, "quantite": 10, "prix_unitaire": 200}],
    }).json()["id"]
    assert client.post(f"/api/ventes/{vid}/valider", headers=h).status_code == 400


def test_proforma_sans_mouvement(client, demo):
    h = _auth(client)
    aid = _article_avec_stock(client, h, "VTE-3", 10, 100)
    vid = client.post("/api/ventes", headers=h, json={
        "type": "proforma", "lignes": [{"article_id": aid, "quantite": 4, "prix_unitaire": 300}],
    }).json()["id"]
    client.post(f"/api/ventes/{vid}/valider", headers=h)
    # proforma : stock inchangé
    assert float(client.get(f"/api/articles/{aid}", headers=h).json()["quantite"]) == 10


def test_retour_reincremente_stock(client, demo):
    h = _auth(client)
    aid = _article_avec_stock(client, h, "VTE-4", 10, 100)
    vid = client.post("/api/ventes", headers=h, json={
        "type": "retour", "lignes": [{"article_id": aid, "quantite": 3, "prix_unitaire": 250}],
    }).json()["id"]
    client.post(f"/api/ventes/{vid}/valider", headers=h)
    assert float(client.get(f"/api/articles/{aid}", headers=h).json()["quantite"]) == 13


def test_paiements_et_kpis(client, demo):
    h = _auth(client)
    aid = _article_avec_stock(client, h, "VTE-5", 50, 100)
    vid = client.post("/api/ventes", headers=h, json={
        "type": "facture", "lignes": [{"article_id": aid, "quantite": 10, "prix_unitaire": 200}],
    }).json()["id"]
    client.post(f"/api/ventes/{vid}/valider", headers=h)

    r = client.post(f"/api/ventes/{vid}/paiements", headers=h, json={"montant": 800})
    assert float(r.json()["reste_a_payer"]) == 1200  # total 2000 - 800

    k = client.get("/api/ventes/kpis", headers=h).json()
    assert k["nb_ventes"] == 1
    assert float(k["chiffre_affaires"]) == 2000
    assert float(k["marge"]) == 1000   # (200-100)*10
    assert float(k["panier_moyen"]) == 2000
