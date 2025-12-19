from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return create_engine(
        str(settings.SQLALCHEMY_DATABASE_URI),
        echo=settings.LOG_SQL,
        pool_pre_ping=True,
        pool_recycle=3600,
    )


@lru_cache(maxsize=1)
def get_sessionmaker() -> sessionmaker[Session]:
    return sessionmaker(
        get_engine(),
        class_=Session,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


def get_session() -> Generator[Session, None, None]:
    with get_sessionmaker()() as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
