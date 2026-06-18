"""Moteur et session de base de données."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url_sync, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    """Dépendance FastAPI : fournit une session puis la ferme."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
