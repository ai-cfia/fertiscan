"""Product CRUD operations."""

from datetime import datetime
from uuid import UUID

from aiobotocore.client import AioBaseClient  # type: ignore[import-untyped]
from pydantic import validate_call
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.label import Label
from app.db.models.product import Product
from app.db.models.user import User
from app.storage import delete_files


@validate_call(config={"arbitrary_types_allowed": True})
def get_pattern_for_ilike(input_str: str) -> str:
    """Escape special characters for ILIKE pattern matching and prevent SQL injection."""
    return (
        input_str.replace("\\", "\\\\")
        .replace("[", "\\[")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )


@validate_call(config={"arbitrary_types_allowed": True})
def get_products_query(
    _user_id: UUID,
    product_type_id: UUID,
    registration_number: str | None = None,
    brand_name: str | None = None,
    product_name: str | None = None,
    created_by: str | None = None,
    start_created_at: datetime | None = None,
    end_created_at: datetime | None = None,
    start_updated_at: datetime | None = None,
    end_updated_at: datetime | None = None,
) -> SelectOfScalar[Product]:
    """Build products query with optional filters."""
    stmt = select(Product).where(Product.product_type_id == product_type_id)

    # Filter by registration number (exact match, case-insensitive)
    if registration_number:
        assert registration_number is not None
        stmt = stmt.where(Product.registration_number.ilike(registration_number))  # type: ignore[attr-defined]

    # Filter by brand name (en or fr)
    if brand_name:
        assert brand_name is not None
        pattern = get_pattern_for_ilike(brand_name)
        stmt = stmt.where(
            (Product.brand_name_en.ilike(f"%{pattern}%", escape="\\"))  # type: ignore[union-attr]
            | (Product.brand_name_fr.ilike(f"%{pattern}%", escape="\\"))  # type: ignore[union-attr]
        )
    # Filter by product name (en or fr)
    if product_name:
        assert product_name is not None
        pattern = get_pattern_for_ilike(product_name)
        stmt = stmt.where(
            (Product.name_en.ilike(f"%{pattern}%", escape="\\"))  # type: ignore[union-attr]
            | (Product.name_fr.ilike(f"%{pattern}%", escape="\\"))  # type: ignore[union-attr]
        )

    # Filter by created by (user's full name)
    if created_by:
        pattern = get_pattern_for_ilike(created_by)
        stmt = stmt.join(User, Product.created_by_id == User.id).where(  # type: ignore[arg-type]
            func.concat(
                func.coalesce(User.first_name, ""),
                " ",
                func.coalesce(User.last_name, ""),
            ).ilike(f"%{pattern}%", escape="\\")
        )

    # Filter by created at (supports partial dates)
    if start_created_at and end_created_at:
        stmt = stmt.where(
            (Product.created_at >= start_created_at)
            & (Product.created_at <= end_created_at)
        )

    # Filter by updated at (supports partial dates)
    if start_updated_at and end_updated_at:
        stmt = stmt.where(
            (Product.updated_at >= start_updated_at)
            & (Product.updated_at <= end_updated_at)
        )
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
