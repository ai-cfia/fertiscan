"""Product dependencies."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlalchemy import func
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
        Product.product_type_id == product_type.id,
        func.lower(Product.registration_number)
        == func.lower(product_in.registration_number),
    )
    if session.scalar(stm):
        raise ResourceConflict(
            f"Product with registration number {product_in.registration_number}"
            + " is already exist on the same product type."
        )
    product = Product(
        product_type_id=product_type.id,
        registration_number=product_in.registration_number,
        brand_name_en=product_in.brand_name_en,
        brand_name_fr=product_in.brand_name_fr,
        name_en=product_in.name_en,
        name_fr=product_in.name_fr,
        created_by=current_user,
    )
    return product


ProductRegistrationNumberUniqueDep = Annotated[
    Product, Depends(ensure_product_registration_number_unique)
]

# ============================== Retrieval Dependencies ==============================


def get_product_by_id(session: SessionDep, product_id: UUID) -> Product:
    """Get product by ID or raise 404."""
    if not (product := session.get(Product, product_id)):
        raise ProductNotFound(str(product_id))
    return product


ProductDep = Annotated[Product, Depends(get_product_by_id)]
