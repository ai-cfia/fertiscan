"""Schema for registration number type."""

from typing import Annotated

from pydantic import StringConstraints

RegistrationNumber = Annotated[
    str,
    StringConstraints(
        # pattern=r"^([0-9]{7}[FfPpGgHhMmSs])?$",
        pattern=r"^([0-9]{7}[A-Za-z])?$",
        strict=True,
        strip_whitespace=True,
        to_upper=True,
    ),
]
