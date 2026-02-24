"""Controller for rules."""

from uuid import UUID

from pydantic import validate_call
from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.db.models.rule import Rule


@validate_call(config={"arbitrary_types_allowed": True})
def get_rules_query(
    reference_number: str | None, rule_id: UUID | None
) -> SelectOfScalar[Rule]:
    """Build rules query with optional filters."""
    stmt = select(Rule)
    if reference_number is not None:
        stmt = stmt.where(Rule.reference_number.ilike(f"%{reference_number}%"))  # type: ignore[attr-defined]
    if rule_id is not None:
        stmt = stmt.where(Rule.id == rule_id)

    return stmt
