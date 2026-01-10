"""API routes."""

from fastapi import APIRouter

from app.config import settings
from app.routes import health, labels, login, products, users

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(labels.router)
api_router.include_router(products.router)

if settings.ENVIRONMENT in ("local", "testing"):
    from app.routes import private

    api_router.include_router(private.router)

__all__ = ["api_router", "health"]
