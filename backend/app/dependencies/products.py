"""Product dependencies."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlmodel import select

from app.db.models.product import Product
from app.dependencies.auth import CurrentUser, SessionDep
from app.dependencies.product_types import ProductCreateTypeDep
from app.exceptions import ProductNotFound, ResourceConflict
from app.schemas.product import ProductCreate


# ============================== Validation Dependencies ==============================
def ensure_product_registration_number_unique(
    session: SessionDep,
    current_user: CurrentUser,
    product_in: ProductCreate,
    product_type: ProductCreateTypeDep,
) -> Product:
    """Ensure product registration number is unique for product type, raise 409 if duplicate.
    Returns a Product instance (not yet persisted to database)."""

    stm = select(Product.id).where(
        Product.registration_number.ilike(  # type: ignore[attr-defined]
            product_in.registration_number
        )
    )
    if session.scalar(stm):
        msg = f"Product with registration number {product_in.registration_number} already exists."
        raise ResourceConflict(msg)
    return Product(
        **product_in.model_dump(exclude={"product_type"}),
        product_type=product_type,
        created_by=current_user,
    )


NewProductDep = Annotated[Product, Depends(ensure_product_registration_number_unique)]


# ============================== Retrieval Dependencies ==============================


def get_product_by_id(session: SessionDep, product_id: UUID) -> Product:
    """Get product by ID or raise 404."""
    if not (product := session.get(Product, product_id)):
        raise ProductNotFound(str(product_id))
    return product


ProductDep = Annotated[Product, Depends(get_product_by_id)]
