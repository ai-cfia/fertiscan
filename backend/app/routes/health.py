"""Health check endpoints."""

from fastapi import APIRouter
from sqlalchemy import text

from app.dependencies import SessionDep
from app.schemas.health import Health, Readiness

router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=Health)
def liveness() -> Health:
    """Liveness probe - is the application running?"""
    return Health(status="ok")


@router.get("/readyz", response_model=Readiness)
def readiness(
    session: SessionDep,
) -> Readiness:
    """Readiness probe - can the application handle requests?"""
    session.execute(text("SELECT 1"))
    return Readiness(status="ok", database="connected")
