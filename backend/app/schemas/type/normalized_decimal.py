"""Schema of normalized decimal type"""

from decimal import Decimal, InvalidOperation
from typing import Annotated, Any

from pydantic import BeforeValidator, Field


def normalized_decimal(v: Any) -> Decimal:
    if isinstance(v, Decimal):
        return v

    if isinstance(v, str):
        v = v.strip()
        if v == "":
            raise ValueError("Input should be a valid decimal")
    if v is None:
        raise ValueError("Input should be a valid decimal")
    try:
        return Decimal(str(v))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("Input should be a valid decimal") from exc


NormalizedDecimal = Annotated[
    Decimal,
    BeforeValidator(normalized_decimal),
    Field(
        description="A verbatim decimal number that is normalized",
        examples=["1.0", "1", "0.001", "100.43"],
    ),
]
