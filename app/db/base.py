"""SQLModel base configuration with metadata and common mixins."""

from sqlalchemy import MetaData
from sqlmodel import SQLModel

naming_convention = {
    "ix": "ix_%(column_0_label)s",  # Index
    "uq": "uq_%(table_name)s_%(column_0_name)s",  # Unique constraint
    "ck": "ck_%(table_name)s_%(constraint_name)s",  # Check constraint
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",  # Foreign key
    "pk": "pk_%(table_name)s",  # Primary key
}
metadata = MetaData(naming_convention=naming_convention)


class Base(SQLModel):
    metadata = metadata


async def create_db_and_tables() -> None:
    """Create all tables from SQLModel metadata.

    TEMPORARY: Development utility until Alembic is configured.
    """
    import app.db.models.item  # noqa: F401 - Import registers model with metadata
    import app.db.models.user  # noqa: F401 - Import registers model with metadata
    from app.db.session import engine

    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)
