"""Schema for registration number type."""

from typing import Annotated

from pydantic import Field, StringConstraints

RegistrationNumber = Annotated[
    str,
    StringConstraints(
        # pattern=r"^([0-9]{7}[FfPpGgHhMmSs])?$",
        pattern=r"^([0-9]{7}[A-Za-z])?$",
        strict=True,
        strip_whitespace=True,
        to_upper=True,
    ),
    Field(
        description=(
            "Registration number of the product itself :"
            "7 digits followed by a letter (e.g. 1234567F)."
            " Can be empty if unknown."
        ),
        examples=["1234567F"],
    ),
]
