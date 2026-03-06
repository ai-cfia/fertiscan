"""Schema for registration number type."""

from typing import Annotated, Literal

from pydantic import BeforeValidator, StringConstraints


def _spaces_to_empty(v: str | None):
    if isinstance(v, str) and v.strip() == "":
        return ""
    return v


EmptyRegistrationNumber = Literal[""]
NonEmptyRegistrationNumber = Annotated[
    str,
    StringConstraints(
        pattern=r"^[0-9]{7}[FfPpGgHhMmSs]$",
        strict=True,
        strip_whitespace=True,
        to_upper=True,
    ),
]

RegistrationNumber = Annotated[
    EmptyRegistrationNumber | NonEmptyRegistrationNumber,
    BeforeValidator(_spaces_to_empty),
]
