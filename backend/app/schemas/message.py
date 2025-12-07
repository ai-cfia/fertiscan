"""Message schemas."""

from sqlmodel import SQLModel


class Message(SQLModel):
    message: str
