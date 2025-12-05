"""Health check endpoints."""

from fastapi import APIRouter
from sqlalchemy import text

from app.dependencies import AsyncSessionDep
from app.schemas.health import Health, Readiness

router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=Health)
async def liveness() -> Health:
    """Liveness probe - is the application running?"""
    return Health(status="ok")


@router.get("/readyz", response_model=Readiness)
async def readiness(
    session: AsyncSessionDep,
) -> Readiness:
    """Readiness probe - can the application handle requests?"""
    await session.execute(text("SELECT 1"))
    return Readiness(status="ok", database="connected")
