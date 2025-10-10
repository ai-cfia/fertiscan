"""Email schemas."""

from sqlmodel import SQLModel


class EmailData(SQLModel):
    html_content: str
    subject: str
