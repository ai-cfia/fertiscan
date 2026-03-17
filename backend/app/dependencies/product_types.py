"""Product type dependencies."""

from typing import Annotated

from fastapi import Depends, Query

from app.controllers.product_types import get_product_type_by_code
from app.db.models.product_type import ProductType
from app.dependencies.session import SessionDep
from app.exceptions import InactiveProductType, ProductTypeNotFound
from app.schemas.label import LabelCreate
from app.schemas.product import ProductCreate


def _get_product_type_by_code_or_raise(
    session: SessionDep, product_type_code: str
) -> ProductType:
    """Get product type by code or raise 400."""
    if not (product_type := get_product_type_by_code(session, product_type_code)):
        raise ProductTypeNotFound(product_type_code)
    if not product_type.is_active:
        raise InactiveProductType(product_type_code)
    return product_type


def get_product_type(session: SessionDep, label_in: LabelCreate) -> ProductType:
    """Get product type from label create request or raise 400."""
    return _get_product_type_by_code_or_raise(session, label_in.product_type)


ProductTypeDep = Annotated[ProductType, Depends(get_product_type)]


def get_product_type_from_product(
    session: SessionDep, product_in: ProductCreate
) -> ProductType:
    """Get product type from product create request or raise 400."""
    return _get_product_type_by_code_or_raise(session, product_in.product_type)


ProductCreateTypeDep = Annotated[ProductType, Depends(get_product_type_from_product)]


def get_query_product_type(
    session: SessionDep,
    product_type: str = Query(default="fertilizer", description="Product type"),
) -> ProductType:
    """Get product type from query parameter or raise 400."""
    return _get_product_type_by_code_or_raise(session, product_type)


ProductQueryTypeDep = Annotated[ProductType, Depends(get_query_product_type)]
