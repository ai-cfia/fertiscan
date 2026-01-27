"""Product CRUD operations."""

from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.product import Product


@validate_call(config={"arbitrary_types_allowed": True})
def get_products_query(
    _user_id: UUID,
    product_type_id: UUID,
    registration_number: str | None = None,
) -> SelectOfScalar[Product]:
    """Build products query with optional filters."""
    stmt = select(Product).where(Product.product_type_id == product_type_id)

    # Filter by registration number
    if registration_number:
        stmt = stmt.where(Product.registration_number == registration_number)

    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def create_product(session: Session, product: Product) -> Product:
    """Create a new product."""
    session.add(product)
    session.flush()
    session.refresh(product)
    return product
