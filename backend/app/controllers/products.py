"""Product CRUD operations."""

from datetime import datetime
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
    brand_name: str | None = None,
    product_name: str | None = None,
    start_created_at: datetime | None = None,
    end_created_at: datetime | None = None,
    start_updated_at: datetime | None = None,
    end_updated_at: datetime | None = None,
) -> SelectOfScalar[Product]:
    """Build products query with optional filters."""
    stmt = select(Product).where(Product.product_type_id == product_type_id)

    # Filter by registration number (partial match, case-insensitive)
    if registration_number:
        stmt = stmt.where(Product.registration_number.ilike(f"%{registration_number}%"))  # type: ignore[attr-defined]

    # Filter by brand name (en or fr)
    if brand_name:
        stmt = stmt.where(
            (Product.brand_name_en.ilike(f"%{brand_name}%"))  # type: ignore[union-attr]
            | (Product.brand_name_fr.ilike(f"%{brand_name}%"))  # type: ignore[union-attr]
        )
    # Filter by product name (en or fr)
    if product_name:
        stmt = stmt.where(
            (Product.name_en.ilike(f"%{product_name}%"))  # type: ignore[union-attr]
            | (Product.name_fr.ilike(f"%{product_name}%"))  # type: ignore[union-attr]
        )

    # Filter by start created at
    if start_created_at:
        stmt = stmt.where(Product.created_at >= start_created_at)

    # Filter by end created at
    if end_created_at:
        stmt = stmt.where(Product.created_at <= end_created_at)

    # Filter by start updated
    if start_updated_at:
        stmt = stmt.where(Product.updated_at >= start_updated_at)

    # Filter by end updated at
    if end_updated_at:
        stmt = stmt.where(Product.updated_at <= end_updated_at)
    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def get_product_by_id(
    session: Session,
    product_id: UUID | str,
) -> Product | None:
    """Get product by ID."""
    if isinstance(product_id, str):
        product_id = UUID(product_id)
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
    session: Session, product: Product, s3_client: AioBaseClient
) -> None:
    """Delete a product"""
    stm = select(Label).where(Label.product_id == product.id)
    if label := session.scalar(stm):
        if file_paths := [img.file_path for img in label.images]:
            await delete_files(client=s3_client, file_paths=file_paths)

    session.delete(product)
    session.flush()
