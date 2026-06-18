"""Fixtures de test : base SQLite en mémoire + client FastAPI isolé."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Désactive la création de tables et le seed sur la vraie base au démarrage de l'app.
from app.core.config import settings

settings.AUTO_CREATE_TABLES = False
settings.SEED_DEMO = False

from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.db.seed import init_demo  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    import app.models  # noqa: F401  (enregistre les modèles)

    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def demo(db_session):
    """Injecte l'entreprise + magasin + admin de démonstration."""
    init_demo(db_session)
    return db_session
