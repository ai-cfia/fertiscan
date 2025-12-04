"""Database session management and engine configuration."""

from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


@lru_cache(maxsize=1)
def get_async_engine() -> AsyncEngine:
    """Get or create the async database engine (cached)."""
    return create_async_engine(
        str(settings.SQLALCHEMY_DATABASE_URI_ASYNC),
        echo=settings.LOG_SQL,
        pool_pre_ping=True,
        pool_recycle=3600,
    )


@lru_cache(maxsize=1)
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Get or create the async sessionmaker (cached)."""
    return async_sessionmaker[AsyncSession](
        get_async_engine(),
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with get_sessionmaker()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
