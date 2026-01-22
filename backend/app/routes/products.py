"""Product routes."""

from fastapi import APIRouter, Depends, Query
from fastapi_pagination import LimitOffsetPage, LimitOffsetParams
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import products as product_controller
from app.dependencies import CurrentUser, SessionDep
from app.schemas.product import ProductPublic

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
