"""Health check schemas."""

from pydantic import BaseModel


class Health(BaseModel):
    status: str


class Readiness(Health):
    database: str
