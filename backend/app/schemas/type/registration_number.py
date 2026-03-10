"""Schema for registration number type."""

from typing import Annotated

from pydantic import Field, StringConstraints

RegistrationNumber = Annotated[
    str,
    StringConstraints(
        pattern=r"^([0-9]{7}[A-Za-z])?$",
        # pattern=r"^([0-9]{7}[FfPpGgHhMmSs])?$",
        strict=True,
        strip_whitespace=True,
        to_upper=True,
    ),
    Field(
        description=(
            "A registration number consisting of 7 digits followed by a letter. "
            "Canonical suffix letters are typically F, P, G, H, M, or S."
        )
    ),
]
