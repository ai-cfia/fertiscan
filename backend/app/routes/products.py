"""Product routes."""

from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi_pagination import LimitOffsetPage, LimitOffsetParams
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import products as product_controller
from app.dependencies import CurrentUser, ProductTypeDep, SessionDep
from app.exceptions import ResourceConflict
from app.schemas.product import ProductCreate, ProductPublic

router = APIRouter(prefix="/products", tags=["products"])


# ============================== CRUD ==============================
@router.get("", response_model=LimitOffsetPage[ProductPublic])
def read_products(
    session: SessionDep,
    current_user: CurrentUser,
    params: LimitOffsetParams = Depends(),
    product_type: str = Query(default="fertilizer", description="Product type"),
) -> LimitOffsetPage[ProductPublic]:
    """List products with optional filters."""
    stmt = product_controller.get_products_query(
        user_id=current_user.id,
        product_type=product_type,
    )
    return paginate(session, stmt, params)  # type: ignore[no-any-return, call-overload]


@router.post("", response_model=ProductPublic, status_code=201)
async def create_product(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    product_in: ProductCreate,
    product_type: ProductTypeDep,
) -> Any:
    """Create a new product."""
    if product_controller.verify_product_registration_number(
        product_type_id=product_type.id,
        registration_number=product_in.registration_number,
    ):
        raise ResourceConflict(
            f"Product with registration number {product_in.registration_number}"
            + " is already exist on the same product type."
        )
    product = product_controller.create_product(
        session=session,
        user=current_user,
        registration_number=product_in.registration_number,
        product_type=product_in.product_type,
        brand_name_en=product_in.brand_name_en,
        brand_name_fr=product_in.brand_name_fr,
        name_en=product_in.name_en,
        name_fr=product_in.name_fr,
    )
    return product
