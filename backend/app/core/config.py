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

    FRONTEND_ORIGIN: str = "https://learn-bridge-hazel.vercel.app"
    DAILY_SESSION_CAP: int = 5
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    @property
    def allowed_origins(self) -> list[str]:
        """Parsed list of allowed frontend origins with automatic URL normalization."""
        raw_items = [orig.strip() for orig in self.FRONTEND_ORIGIN.split(",") if orig.strip()]
        origins = set()
        for item in raw_items:
            clean = item.rstrip("/")
            origins.add(clean)
            if not clean.startswith("http://") and not clean.startswith("https://"):
                origins.add(f"https://{clean}")
                origins.add(f"http://{clean}")

        # Always include production Vercel frontend and local development
        origins.add("https://learn-bridge-hazel.vercel.app")
        origins.add("http://localhost:3000")
        origins.add("http://127.0.0.1:3000")
        return list(origins)

    @property
    def sync_database_url(self) -> str:
        """Returns a synchronous database URL for scripts/alembic."""
        import re
        url = self.DATABASE_URL
        if url.startswith("sqlite+aiosqlite:"):
            return url.replace("sqlite+aiosqlite:", "sqlite:")
        if url.startswith("postgresql+psycopg:"):
            url = url.replace("postgresql+psycopg:", "postgresql:")
        if url.startswith("postgresql+asyncpg:"):
            url = url.replace("postgresql+asyncpg:", "postgresql:")

        supabase_match = re.search(r"@db\.([a-z0-9]+)\.supabase\.co(?::5432)?", url)
        if supabase_match:
            project_ref = supabase_match.group(1)
            url = re.sub(
                r"://([^:]+):",
                lambda m: f"://{m.group(1)}.{project_ref}:" if f".{project_ref}" not in m.group(1) else f"://{m.group(1)}:",
                url,
                count=1
            )
            url = re.sub(
                r"@db\.[a-z0-9]+\.supabase\.co(?::5432)?",
                "@aws-0-ap-south-1.pooler.supabase.com:5432",
                url
            )
        return url


settings = Settings()
