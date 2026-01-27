"""Product routes."""

from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Query
from fastapi_pagination import LimitOffsetPage
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import products as product_controller
from app.dependencies import (
    CurrentUser,
    LimitOffsetParamsDep,
    ProductTypeQueryDep,
    SessionDep,
)
from app.schemas.product import ProductCreate, ProductPublic

router = APIRouter(prefix="/products", tags=["products"])


# ============================== CRUD ==============================
@router.get("", response_model=LimitOffsetPage[ProductPublic])
def read_products(
    session: SessionDep,
    current_user: CurrentUser,
    params: LimitOffsetParamsDep,
    product_type: ProductTypeQueryDep,
    registration_number: Annotated[
        str | None,
        Query(
            description="Registration number",
            max_length=50,
            pattern=r"^[a-zA-Z0-9\s-]+$",
        ),
    ] = None,
) -> LimitOffsetPage[ProductPublic]:
    """List products with optional filters."""
    stmt = product_controller.get_products_query(
        _user_id=current_user.id,
        product_type_id=product_type.id,
        registration_number=registration_number,
    )
    return paginate(session, stmt, params)  # type: ignore[no-any-return, call-overload]


# TODO: Remove dummy implementation - see #339
@router.post("", response_model=ProductPublic, status_code=201)
def create_product(
    *,
    _current_user: CurrentUser,
    product_in: ProductCreate,
) -> Any:
    """Create new product (dummy implementation)."""
    return ProductPublic(
        id=uuid4(),
        registration_number=product_in.registration_number,
        name_en=product_in.name_en,
        name_fr=product_in.name_fr,
    )
