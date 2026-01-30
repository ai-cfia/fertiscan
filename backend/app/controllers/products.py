"""Product CRUD operations."""

from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.label import Label
from app.db.models.product import Product
from app.storage import delete_files


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
def get_product_by_id(
    session: Session,
    product_id: UUID | str,
) -> Product | None:
    """Get product by ID."""
    stmt = select(Product).where(Product.id == product_id)
    result = session.execute(stmt)
    return result.scalar_one_or_none()


@validate_call(config={"arbitrary_types_allowed": True})
def create_product(session: Session, product: Product) -> Product:
    """Create a new product."""
    session.add(product)
    session.flush()
    session.refresh(product)
    return product


@validate_call(config={"arbitrary_types_allowed": True})
async def delete_product(
    session: Session, product_id: UUID | str, s3_client: AioBaseClient
) -> bool:
    """Delete a product"""
    if not (product := get_product_by_id(session=session, product_id=product_id)):
        return False

    stm = select(Label).where(Label.product_id == product.id)
    label = session.scalar(stm)
    if label:
        file_paths = [img.file_path for img in label.images]
        if file_paths:
            await delete_files(client=s3_client, file_paths=file_paths)

    session.delete(product)
    session.flush()
    return True
