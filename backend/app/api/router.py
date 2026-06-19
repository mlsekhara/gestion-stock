"""Agrégateur des routeurs de l'API."""
from fastapi import APIRouter

from app.api import achats, articles, auth, primes, referentiels, stock, tiers, utilisateurs, ventes

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(articles.router)
api_router.include_router(stock.router)
api_router.include_router(referentiels.familles_router)
api_router.include_router(referentiels.marques_router)
api_router.include_router(referentiels.unites_router)
api_router.include_router(referentiels.taxes_router)
api_router.include_router(tiers.fournisseurs_router)
api_router.include_router(tiers.clients_router)
api_router.include_router(achats.router)
api_router.include_router(ventes.router)
api_router.include_router(primes.router)
api_router.include_router(utilisateurs.router)
