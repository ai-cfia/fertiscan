from datetime import datetime
from typing import Annotated

from fastapi import Query
from pydantic import AfterValidator

from app.exceptions import DateUnprocessableEntity


def validate_date_format(date_str: str | None) -> str | None:
    """Validate a partial ISO 8601 date string (YYYY-MM-DD, YYYY-MM, or YYYY)."""
    if not date_str:
        return None

    formats = ["%Y-%m-%d", "%Y-%m", "%Y"]

    for fmt in formats:
        try:
            datetime.strptime(date_str, fmt)
            return date_str
        except ValueError:
            continue

    raise DateUnprocessableEntity(
        f"Invalid date format: {date_str}. Use YYYY-MM-DD, YYYY-MM, or YYYY"
    )


DateDep = Annotated[
    str | None,
    AfterValidator(validate_date_format),
    Query(
        description="Date in ISO 8601 format (YYYY-MM-DD, YYYY-MM, or YYYY)",
        max_length=30,
    ),
]
