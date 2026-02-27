from datetime import datetime

from sqlalchemy import DateTime, MetaData, func
from sqlmodel import Field, SQLModel

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


class TimestampMixin(SQLModel):
    created_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "nullable": False},
    )  # type: ignore[call-overload]
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
            "nullable": False,
        },
    )  # type: ignore[call-overload]


class GuidanceMixin(SQLModel):
    guidance_en: str | None = Field(default=None)
    guidance_fr: str | None = Field(default=None)


class DescriptiveMixin(SQLModel):
    title_en: str | None = Field(default=None, max_length=255)
    title_fr: str | None = Field(default=None, max_length=255)
    description_en: str | None = Field(default=None)
    description_fr: str | None = Field(default=None)
