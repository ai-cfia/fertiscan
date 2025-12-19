"""Health check schemas."""

from sqlmodel import SQLModel


class Health(SQLModel):
    status: str


class Readiness(Health):
    database: str
