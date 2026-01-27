"""Product CRUD operations."""

from uuid import UUID

from pydantic import validate_call
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.product import Product
from app.db.models.product_type import ProductType
from app.dependencies import CurrentUser, SessionDep


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


@validate_call(config={"arbitrary_types_allowed": True})
def verify_product_registration_number(
    product_type_id: UUID, registration_number, session: SessionDep
) -> bool:
    """Verify if a product has the same registration number of the same type."""
    stmt = (
        select(Product.id)
        .where(
            Product.product_type_id == product_type_id,
            Product.registration_number == registration_number,
        )
        .exists()
    )

    return bool(stmt)


@validate_call(config={"arbitrary_types_allowed": True})
def create_product(
    session,
    user: CurrentUser,
    product_type: str,
    registration_number: str,
    brand_name_en: str | None = None,
    brand_name_fr: str | None = None,
    name_en: str | None = None,
    name_fr: str | None = None,
) -> Product:
    """Create a new prroduct."""
    product = Product(
        product_type=product_type,
        registration_number=registration_number,
        brand_name_en=brand_name_en,
        brand_name_fr=brand_name_fr,
        name_en=name_en,
        name_fr=name_fr,
        created_by=user,
    )
    session.add(product)
    session.flush()
    session.refresh(product)
    return product
