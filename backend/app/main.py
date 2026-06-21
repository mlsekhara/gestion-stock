"""Point d'entrée de l'API Gestion de Stock."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    import app.models  # noqa: F401  (enregistre les modèles sur Base.metadata)

    if settings.SEED_RESET:
        Base.metadata.drop_all(bind=engine)

    if settings.AUTO_CREATE_TABLES:
        Base.metadata.create_all(bind=engine)

    if settings.SEED_DEMO:
        from app.db.seed import init_demo

        with SessionLocal() as db:
            init_demo(db)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="API de gestion de stock multi-magasins (Stock · Achats · Ventes).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Santé"], summary="Vérification de l'état de l'API")
def racine() -> dict[str, str]:
    return {"application": settings.APP_NAME, "statut": "ok", "version": "0.1.0"}


@app.get(f"{settings.API_PREFIX}/sante", tags=["Santé"], summary="Health check")
def sante() -> dict[str, str]:
    return {"statut": "ok"}
