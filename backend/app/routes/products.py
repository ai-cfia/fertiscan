"""Product routes."""

from typing import Annotated

from fastapi import APIRouter, Query
from fastapi_pagination import LimitOffsetPage
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import products as product_controller
from app.dependencies import (
    CurrentUser,
    DateDep,
    LimitOffsetParamsDep,
    ProductRegistrationNumberUniqueDep,
    ProductTypeQueryDep,
    S3ClientDep,
    SessionDep,
)
from app.exceptions import ProductNotFound
from app.schemas.message import Message
from app.schemas.product import ProductPublic

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
    brand_name: Annotated[
        str | None,
        Query(
            description="Brand name",
            max_length=100,
        ),
    ] = None,
    product_name: Annotated[
        str | None,
        Query(
            description="Product name",
            max_length=100,
        ),
    ] = None,
    created_by: Annotated[
        str | None,
        Query(
            description="The user who created the product",
            max_length=36,
        ),
    ] = None,
    created_at: DateDep = None,
    updated_at: DateDep = None,
) -> LimitOffsetPage[ProductPublic]:
    """List products with optional filters."""

    stmt = product_controller.get_products_query(
        _user_id=current_user.id,
        product_type_id=product_type.id,
        registration_number=registration_number,
        brand_name=brand_name,
        product_name=product_name,
        created_by=created_by,
        created_at=created_at,
        updated_at=updated_at,
    )
    return paginate(session, stmt, params)  # type: ignore[no-any-return, call-overload]


@router.get("/{product_id}", response_model=ProductPublic)
def read_product_by_id(
    *, session: SessionDep, _: CurrentUser, product_id: str
) -> ProductPublic:
    """Get product by ID."""
    if not (
        product := product_controller.get_product_by_id(
            session=session, product_id=product_id
        )
    ):
        raise ProductNotFound()
    return product  # type: ignore[return-value]


@router.post("", response_model=ProductPublic, status_code=201)
async def create_product(
    *,
    session: SessionDep,
    product: ProductRegistrationNumberUniqueDep,
    _: CurrentUser,
) -> ProductPublic:
    """Create a new product."""
    created_product = product_controller.create_product(
        session=session, product=product
    )
    return created_product  # type: ignore[return-value]


@router.delete("/{product_id}", response_model=Message, status_code=200)
async def delete_product(
    *,
    session: SessionDep,
    _: CurrentUser,
    product_id: str,
    s3_client: S3ClientDep,
) -> Message:
    """Delete a product"""
    if not await product_controller.delete_product(
        session=session, product_id=product_id, s3_client=s3_client
    ):
        raise ProductNotFound()
    return Message(message="Product deleted successfully")
