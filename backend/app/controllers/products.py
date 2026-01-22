"""Product CRUD operations."""

from uuid import UUID

from pydantic import validate_call
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.product import Product
from app.db.models.product_type import ProductType


@validate_call(config={"arbitrary_types_allowed": True})
def get_products_query(
    user_id: UUID,  # noqa: ARG001
    product_type: str = "fertilizer",
) -> SelectOfScalar[Product]:
    """Build products query with optional filters."""
    stmt = select(Product)

    # Filter by product type
    stmt = stmt.join(ProductType).where(
        ProductType.code == product_type,
        ProductType.is_active,
    )

    return stmt
