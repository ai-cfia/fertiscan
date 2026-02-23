"""API routes."""

from fastapi import APIRouter

from app.config import settings
from app.routes import compliance, health, login, products, rule, users
from app.routes.labels import (
    fertilizer_label_data,
    label,
    label_data,
    label_data_extraction,
    label_image,
)

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(label.router)
api_router.include_router(label_image.router)
api_router.include_router(label_data.router)
api_router.include_router(fertilizer_label_data.router)
api_router.include_router(label_data_extraction.router)
api_router.include_router(products.router)
api_router.include_router(rule.router)
api_router.include_router(compliance.router)

if settings.ENVIRONMENT in ("local", "testing"):
    from app.routes import private

    api_router.include_router(private.router)

__all__ = ["api_router", "health"]
