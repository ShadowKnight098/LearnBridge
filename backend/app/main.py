import sys
import asyncio
if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import sys

from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.teacher import router as teacher_router
from app.api.practice import router as practice_router
from app.api.student import router as student_router
from app.api.content import router as content_router
from app.api.reports import router as reports_router
from app.api.tts import router as tts_router

app = FastAPI(
    title="LearnBridge API",
    version="1.0.0",
    description="Multilingual Adaptive Learning Platform API (NEP 2020 / NIPUN Bharat Aligned)",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if settings.ENVIRONMENT == "production" else "/openapi.json"
)

# Security Headers Middleware (skips OPTIONS preflights to prevent header collision)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    try:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response
    except Exception as exc:
        origin = request.headers.get("origin", "*")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(exc)},
            headers={
                "Access-Control-Allow-Origin": origin if origin else "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": origin if origin else "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# CORS Middleware (outermost middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"^https://([a-zA-Z0-9_-]+\.)?vercel\.app$|^https://([a-zA-Z0-9_-]+\.)?onrender\.com$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# Compression Middleware (compress JSON responses >= 1KB)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(teacher_router)
app.include_router(practice_router)
app.include_router(student_router)
app.include_router(content_router)
app.include_router(reports_router)
app.include_router(tts_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "learnbridge-api",
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.LLM_PROVIDER
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to LearnBridge Multilingual Adaptive Learning API",
        "docs": "/docs",
        "health": "/health"
    }


@app.on_event("startup")
async def ensure_db_migrations():
    from app.core.database import engine
    from sqlalchemy import text
    try:
        async with engine.begin() as conn:
            if engine.dialect.name == "postgresql":
                await conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS hint TEXT;"))
            elif engine.dialect.name == "sqlite":
                res = await conn.execute(text("PRAGMA table_info(questions);"))
                columns = [row[1] for row in res.fetchall()]
                if columns and "hint" not in columns:
                    await conn.execute(text("ALTER TABLE questions ADD COLUMN hint TEXT;"))
    except Exception:
        pass
