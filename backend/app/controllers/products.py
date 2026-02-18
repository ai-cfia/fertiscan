"""Product CRUD operations."""

from datetime import datetime
from typing import Any
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import validate_call
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlmodel import or_, select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.label import Label
from app.db.models.product import Product
from app.storage import delete_files


def _apply_product_sorting(
    stmt: SelectOfScalar[Product],
    order_by: str,
    order: str,
) -> SelectOfScalar[Product]:
    """Apply sorting to products query."""
    valid_sort_fields: dict[str, Any] = {
        "id": Product.id,
        "created_at": Product.created_at,
        "createdAt": Product.created_at,
        "updated_at": Product.updated_at,
        "updatedAt": Product.updated_at,
        "registration_number": Product.registration_number,
        "registrationNumber": Product.registration_number,
        "brand_name_en": func.coalesce(
            Product.brand_name_en,
            Product.brand_name_fr,
        ),
        "brand_name_fr": func.coalesce(
            Product.brand_name_fr,
            Product.brand_name_en,
        ),
        "name_en": func.coalesce(
            Product.name_en,
            Product.name_fr,
        ),
        "name_fr": func.coalesce(
            Product.name_fr,
            Product.name_en,
        ),
    }
    sort_column: Any = valid_sort_fields.get(order_by, Product.created_at)

    if order.lower() == "asc":
        stmt = stmt.order_by(sort_column.asc())
    else:
        stmt = stmt.order_by(sort_column.desc())
    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def get_products_query(
    _user_id: UUID,
    product_type_id: UUID,
    registration_number: str | None = None,
    brand_name_en: str | None = None,
    brand_name_fr: str | None = None,
    name_en: str | None = None,
    name_fr: str | None = None,
    start_created_at: datetime | None = None,
    end_created_at: datetime | None = None,
    start_updated_at: datetime | None = None,
    end_updated_at: datetime | None = None,
    order_by: str = "created_at",
    order: str = "desc",
) -> SelectOfScalar[Product]:
    """Build products query with optional filters."""
    stmt = select(Product).where(Product.product_type_id == product_type_id)

    # Identity Search Attributes (Grouped OR)
    search_conditions = []
    if registration_number:
        search_conditions.append(
            Product.registration_number.ilike(f"%{registration_number}%")  # type: ignore[union-attr]
        )
    if brand_name_en:
        search_conditions.append(
            Product.brand_name_en.ilike(f"%{brand_name_en}%")  # type: ignore[union-attr]
        )
    if brand_name_fr:
        search_conditions.append(
            Product.brand_name_fr.ilike(f"%{brand_name_fr}%")  # type: ignore[union-attr]
        )
    if name_en:
        search_conditions.append(
            Product.name_en.ilike(f"%{name_en}%")  # type: ignore[union-attr]
        )
    if name_fr:
        search_conditions.append(
            Product.name_fr.ilike(f"%{name_fr}%")  # type: ignore[union-attr]
        )

    if search_conditions:
        stmt = stmt.where(or_(*search_conditions))

    # Strict Metadata Filters (AND)
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

    stmt = _apply_product_sorting(stmt, order_by, order)
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
