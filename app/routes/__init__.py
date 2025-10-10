"""API routes."""

from fastapi import APIRouter

from app.config import settings
from app.routes import health, items, login, users

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(items.router)

if settings.ENVIRONMENT == "local":
    from app.routes import private

    api_router.include_router(private.router)

__all__ = ["api_router", "health"]
