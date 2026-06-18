"""Tests Phase 2 : fournisseurs, achats, réception (entrée stock), paiements."""
from app.db.seed import DEMO_EMAIL, DEMO_PASSWORD


def _auth(client):
    tokens = client.post("/api/auth/login", data={"username": DEMO_EMAIL, "password": DEMO_PASSWORD}).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _creer_article(client, h, ref):
    return client.post("/api/articles", headers=h, json={"reference": ref, "designation": ref, "prix_vente": 100}).json()["id"]


def test_fournisseur_crud(client, demo):
    h = _auth(client)
    # le seed crée 2 fournisseurs
    assert len(client.get("/api/fournisseurs", headers=h).json()) == 2
    r = client.post("/api/fournisseurs", headers=h, json={"nom": "Nouveau Fournisseur", "telephone": "0550"})
    assert r.status_code == 201
    fid = r.json()["id"]
    assert r.json()["type"] == "fournisseur"
    assert client.put(f"/api/fournisseurs/{fid}", headers=h, json={"nom": "Modifié"}).json()["nom"] == "Modifié"
    assert client.delete(f"/api/fournisseurs/{fid}", headers=h).status_code == 204


def test_achat_reception_met_a_jour_stock(client, demo):
    h = _auth(client)
    aid = _creer_article(client, h, "ACH-ART")
    fid = client.get("/api/fournisseurs", headers=h).json()[0]["id"]

    # crée la commande
    r = client.post("/api/achats", headers=h, json={
        "fournisseur_id": fid,
        "lignes": [{"article_id": aid, "quantite": 20, "cout_unitaire": 300}],
    })
    assert r.status_code == 201, r.text
    achat = r.json()
    assert achat["statut"] == "commande"
    assert float(achat["montant_total"]) == 6000
    assert float(achat["reste_a_payer"]) == 6000
    achat_id = achat["id"]

    # le stock n'a pas encore bougé
    assert float(client.get(f"/api/articles/{aid}", headers=h).json()["quantite"]) == 0

    # réception -> stock +20, prix moyen 300
    r = client.post(f"/api/achats/{achat_id}/receptionner", headers=h)
    assert r.status_code == 200
    assert r.json()["statut"] == "recue"
    detail = client.get(f"/api/articles/{aid}", headers=h).json()
    assert float(detail["quantite"]) == 20
    assert float(detail["prix_achat_moyen"]) == 300

    # double réception interdite
    assert client.post(f"/api/achats/{achat_id}/receptionner", headers=h).status_code == 400


def test_paiements_et_reste(client, demo):
    h = _auth(client)
    aid = _creer_article(client, h, "PAY-ART")
    r = client.post("/api/achats", headers=h, json={
        "lignes": [{"article_id": aid, "quantite": 10, "cout_unitaire": 100}],
    })
    achat_id = r.json()["id"]  # total 1000

    r = client.post(f"/api/achats/{achat_id}/paiements", headers=h, json={"montant": 400, "methode": "espèces"})
    assert r.status_code == 201
    assert float(r.json()["montant_paye"]) == 400
    assert float(r.json()["reste_a_payer"]) == 600

    client.post(f"/api/achats/{achat_id}/paiements", headers=h, json={"montant": 600, "methode": "virement"})
    assert float(client.get(f"/api/achats/{achat_id}", headers=h).json()["reste_a_payer"]) == 0


def test_suppression_achat_recu_interdite(client, demo):
    h = _auth(client)
    aid = _creer_article(client, h, "DEL-ART")
    achat_id = client.post("/api/achats", headers=h, json={
        "lignes": [{"article_id": aid, "quantite": 5, "cout_unitaire": 50}],
    }).json()["id"]
    client.post(f"/api/achats/{achat_id}/receptionner", headers=h)
    assert client.delete(f"/api/achats/{achat_id}", headers=h).status_code == 400
