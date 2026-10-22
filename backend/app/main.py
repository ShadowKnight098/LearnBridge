from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
