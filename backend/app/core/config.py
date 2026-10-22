import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    DATABASE_URL: str = "sqlite+aiosqlite:///./learnbridge.db"
    JWT_SECRET: str = "learnbridge-dev-secret-key-32-chars-long-min-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    LLM_PROVIDER: str = "gemini"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-3.5-flash-lite"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    FRONTEND_ORIGIN: str = "http://localhost:3000"
    DAILY_SESSION_CAP: int = 5
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    @property
    def allowed_origins(self) -> list[str]:
        """Parsed list of allowed frontend origins."""
        if self.ENVIRONMENT == "production":
            return [orig.strip() for orig in self.FRONTEND_ORIGIN.split(",") if orig.strip()]
        # In development, allow localhost and configured origins
        dev_origins = {"http://localhost:3000", "http://127.0.0.1:3000"}
        for orig in self.FRONTEND_ORIGIN.split(","):
            if orig.strip():
                dev_origins.add(orig.strip())
        return list(dev_origins)

    @property
    def sync_database_url(self) -> str:
        """Returns a synchronous database URL for scripts/alembic."""
        url = self.DATABASE_URL
        if url.startswith("sqlite+aiosqlite:"):
            return url.replace("sqlite+aiosqlite:", "sqlite:")
        if url.startswith("postgresql+psycopg:"):
            return url.replace("postgresql+psycopg:", "postgresql:")
        if url.startswith("postgresql+asyncpg:"):
            return url.replace("postgresql+asyncpg:", "postgresql:")
        if url.startswith("postgresql:"):
            return url
        return url


settings = Settings()
