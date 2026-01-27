"""Pagination dependencies."""

from typing import Annotated

from fastapi import Depends
from fastapi_pagination import LimitOffsetParams

LimitOffsetParamsDep = Annotated[LimitOffsetParams, Depends(LimitOffsetParams)]
