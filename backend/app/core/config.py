"""Configuration de l'application chargée depuis les variables d'environnement."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = "Gestion de Stock"
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/api"

    # Base de données
    DATABASE_URL: str = "postgresql+psycopg2://stock:stock@localhost:5432/gestion_stock"

    @property
    def database_url_sync(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    # Sécurité / JWT
    SECRET_KEY: str = "changez-moi-en-production-clef-secrete-tres-longue"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS (origines autorisées, séparées par des virgules)
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Dev : créer automatiquement les tables au démarrage et injecter le jeu de démo
    AUTO_CREATE_TABLES: bool = True
    SEED_DEMO: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
