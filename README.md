# Gestion de Stock — multi-magasins

Application web **responsive et installable (PWA)** de gestion de stock en **français**,
pensée pour la **téléphonie mobile et les pièces de rechange**, mais générique pour tout
commerce de détail similaire. Inspirée du logiciel *PROST A26* (captures dans `../capture`).

- **Backend** : Python · FastAPI · SQLAlchemy 2 · PostgreSQL · JWT + droits d'accès (RBAC)
- **Frontend** : React + TypeScript + Vite · Ant Design (locale `fr_FR`) · TanStack Query · PWA
- **Mobile** : installable sur Android/iOS, hors-ligne, **scan code-barres / IMEI à la caméra**
- **Multi-tenant** : *Entreprise → Magasins → Utilisateurs* ; stock géré par magasin

## Périmètre (livré par phases)

| Phase | Contenu | État |
|-------|---------|------|
| **0** | Fondations : auth, multi-magasins, navigation FR, PWA, scanner | ✅ Cette livraison |
| 1 | Catalogue & Stock (articles, mouvements, inventaire, alertes) | À venir |
| 2 | Achats (fournisseurs, réceptions, factures) | À venir |
| 3 | Ventes (clients, proforma/factures/retours, marge, échéances) | À venir |
| 4 | Tableau de bord (graphiques, treemap), exports PDF/Excel | À venir |

## Démarrage rapide (Docker — recommandé)

```bash
cd gestion-stock
docker compose up --build
```

- Frontend : http://localhost:8080
- API + documentation : http://localhost:8000/docs
- **Compte de démonstration** : `admin@demo.dz` / `admin123`

Le backend crée les tables et injecte le jeu de démo (entreprise *AD-PHONE ALGERIE* +
magasin principal + utilisateur administrateur) au premier démarrage.

## Développement local (sans Docker)

> **Node ≥ 20 recommandé.** Sur Node 18.x, la *production build* du frontend nécessite
> le drapeau `--experimental-global-webcrypto` (déjà géré par l'image Docker en Node 20).

### Backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate          # Windows : .venv\Scripts\Activate.ps1
pip install -r requirements.txt
# PostgreSQL doit tourner ; sinon : docker compose up -d db
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173 (proxy /api -> :8000)
```

## Tests

```bash
cd backend
pytest                            # auth, isolation multi-tenant
```

## Migrations (production)

En développement les tables sont créées automatiquement (`AUTO_CREATE_TABLES=true`).
En production, utiliser Alembic :

```bash
cd backend
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

## Structure

```
backend/    API FastAPI (app/core, app/models, app/api, app/services, alembic)
frontend/   React + Vite (src/app, src/features, src/api, src/components, src/i18n)
docker-compose.yml
```

## Variables d'environnement

Voir `backend/.env.example` et `frontend/.env.example`. **Changez `SECRET_KEY` en production.**
