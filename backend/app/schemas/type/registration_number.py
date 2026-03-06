"""Schema for registration number type."""

from typing import Annotated

from pydantic import AfterValidator, BeforeValidator, StringConstraints


def _normalize_registration(v: str) -> str:
    """Normalize registration number by uppercasing the last character."""
    return v[:-1] + v[-1].upper()


def _empty_str_to_none(v: str | None) -> str | None:
    """Convert empty string to None before validation."""
    if v is None:
        return None
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


# Base registration number type: validates and normalizes non-null strings
_RegistrationNumberStr = Annotated[
    str,
    StringConstraints(
        pattern=r"^[0-9]{7}[FfPpGgHhMmSs]$",
        min_length=8,
        max_length=8,
        strict=True,
        strip_whitespace=True,
    ),
    AfterValidator(_normalize_registration),
]

# The real RegistrationNumber type allows None and normalizes empty strings to None
RegistrationNumber = Annotated[
    _RegistrationNumberStr | None,
    BeforeValidator(_empty_str_to_none),
]
