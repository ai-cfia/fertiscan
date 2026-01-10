"""ProductType CRUD operations."""

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select

from app.db.models.product_type import ProductType
from app.schemas.product_type import ProductTypeCreate, ProductTypeUpdate


@validate_call(config={"arbitrary_types_allowed": True})
def get_product_type_by_code(
    session: Session,
    code: str,
) -> ProductType | None:
    """Get product type by code."""
    stmt = select(ProductType).where(ProductType.code == code)
    result = session.execute(stmt)
    return result.scalar_one_or_none()


@validate_call(config={"arbitrary_types_allowed": True})
def create_product_type(
    session: Session,
    product_type_in: ProductTypeCreate,
) -> ProductType:
    """Create new product type."""
    product_type = ProductType.model_validate(product_type_in)
    session.add(product_type)
    session.flush()
    session.refresh(product_type)
    return product_type


@validate_call(config={"arbitrary_types_allowed": True})
def update_product_type(
    session: Session,
    product_type_id: UUID,
    product_type_in: ProductTypeUpdate,
) -> ProductType | None:
    """Update a product type."""
    if not (product_type := session.get(ProductType, product_type_id)):
        return None
    update_data = product_type_in.model_dump(exclude_unset=True)
    product_type.sqlmodel_update(update_data)
    session.add(product_type)
    session.flush()
    session.refresh(product_type)
    return product_type
