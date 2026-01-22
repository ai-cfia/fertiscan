import json
from collections.abc import Generator
from decimal import Decimal
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings


# TODO: check if there is no better way to do this
def decimal_json_serializer(obj: object) -> str:
    """JSON serializer that converts Decimal to string for JSONB storage."""

    def decimal_default(value: object) -> object:
        if isinstance(value, Decimal):
            return str(value)
        raise TypeError(f"Object of type {type(value)} is not JSON serializable")

    return json.dumps(obj, default=decimal_default)


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return create_engine(
        str(settings.SQLALCHEMY_DATABASE_URI),
        echo=settings.LOG_SQL,
        pool_pre_ping=True,
        pool_recycle=3600,
        json_serializer=decimal_json_serializer,
        json_deserializer=json.loads,
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
