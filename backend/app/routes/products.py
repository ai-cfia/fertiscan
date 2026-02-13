"""Product routes."""

from fastapi import APIRouter, Depends
from fastapi_pagination import LimitOffsetPage
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import products as product_controller
from app.dependencies import (
    CurrentUser,
    LimitOffsetParamsDep,
    NewProductDep,
    ProductDep,
    ProductQueryTypeDep,
    S3ClientDep,
    SessionDep,
)
from app.exceptions import InvalidDateRange
from app.schemas.message import Message
from app.schemas.product import ProductParams, ProductPublic

router = APIRouter(prefix="/products", tags=["products"])


# ============================== CRUD ==============================
@router.get("", response_model=LimitOffsetPage[ProductPublic])
def read_products(
    session: SessionDep,
    current_user: CurrentUser,
    params: LimitOffsetParamsDep,
    product_type: ProductQueryTypeDep,
    filters: ProductParams = Depends(),
) -> LimitOffsetPage[ProductPublic]:
    """List products with optional filters."""

    if filters.start_created_at and filters.end_created_at:
        if filters.start_created_at > filters.end_created_at:
            raise InvalidDateRange()

    if filters.start_updated_at and filters.end_updated_at:
        if filters.start_updated_at > filters.end_updated_at:
            raise InvalidDateRange()

    stmt = product_controller.get_products_query(
        _user_id=current_user.id,
        product_type_id=product_type.id,
        **filters.model_dump(),
    )
    return paginate(session, stmt, params)  # type: ignore[no-any-return, call-overload]


@router.get("/{product_id}", response_model=ProductPublic)
def read_product_by_id(
    product: ProductDep,
    _: CurrentUser,
) -> ProductPublic:
    """Get product by ID."""
    return product  # type: ignore[return-value]


@router.post("", response_model=ProductPublic, status_code=201)
async def create_product(
    product: NewProductDep,
    session: SessionDep,
    _: CurrentUser,
) -> ProductPublic:
    """Create a new product."""
    return product_controller.create_product(session, product)  # type: ignore[return-value]


@router.delete("/{product_id}", response_model=Message, status_code=200)
async def delete_product(
    *,
    session: SessionDep,
    _: CurrentUser,
    product: ProductDep,
    s3_client: S3ClientDep,
) -> Message:
    """Delete a product"""
    await product_controller.delete_product(
        session=session, product=product, s3_client=s3_client
    )
    return Message(message="Product deleted successfully")
