"""Label API schemas."""

from uuid import UUID

from sqlmodel import SQLModel


class LabelPublic(SQLModel):
    id: UUID


class LabelsPublic(SQLModel):
    data: list[LabelPublic]
    count: int
