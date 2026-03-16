"""Controller for Requirements."""

from datetime import datetime
from uuid import UUID

from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.requirement import Requirement


@validate_call(config={"arbitrary_types_allowed": True})
def get_requirements_query(
    legislation_ids: list[UUID] | None = None,
    title_en: str | None = None,
    title_fr: str | None = None,
    start_created_at: datetime | None = None,
    end_created_at: datetime | None = None,
    start_updated_at: datetime | None = None,
    end_updated_at: datetime | None = None,
    order_by: str = "created_at",
    order: str = "desc",
) -> SelectOfScalar[Requirement]:
    """Build requirements query with optional filters."""
    stmt = select(Requirement)
    if legislation_ids is not None and len(legislation_ids) > 0:
        stmt = stmt.where(Requirement.legislation_id.in_(legislation_ids))  # type: ignore[attr-defined]
    if title_en is not None:
        stmt = stmt.where(Requirement.title_en.ilike(f"%{title_en}%"))  # type: ignore[union-attr]
    if title_fr is not None:
        stmt = stmt.where(Requirement.title_fr.ilike(f"%{title_fr}%"))  # type: ignore[union-attr]
    if start_created_at is not None:
        assert start_created_at is not None
        stmt = stmt.where(Requirement.created_at >= start_created_at)  # type: ignore[operator]
    if end_created_at is not None:
        assert end_created_at is not None
        stmt = stmt.where(Requirement.created_at <= end_created_at)  # type: ignore[operator]
    if start_updated_at is not None:
        assert start_updated_at is not None
        stmt = stmt.where(Requirement.updated_at >= start_updated_at)  # type: ignore[operator]
    if end_updated_at is not None:
        assert end_updated_at is not None
        stmt = stmt.where(Requirement.updated_at <= end_updated_at)  # type: ignore[operator]

    allowed_order_fields = {
        "created_at": Requirement.created_at,
        "updated_at": Requirement.updated_at,
        "title_en": Requirement.title_en,
        "title_fr": Requirement.title_fr,
    }
    order_field = allowed_order_fields.get(order_by, Requirement.created_at)
    if order.lower() == "asc":
        stmt = stmt.order_by(order_field.asc())  # type: ignore[union-attr]
    else:
        assert order.lower() == "desc"
        stmt = stmt.order_by(order_field.desc())  # type: ignore[union-attr]

    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def get_requirement_by_id(
    session: Session,
    requirement_id: UUID | str,
) -> Requirement | None:
    """Get requirement by ID."""
    if isinstance(requirement_id, str):
        requirement_id = UUID(requirement_id)
    stmt = select(Requirement).where(Requirement.id == requirement_id)
    result = session.execute(stmt)
    return result.scalar_one_or_none()
