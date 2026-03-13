"""Email schemas."""

from pydantic import BaseModel


class EmailData(BaseModel):
    html_content: str
    subject: str
