"""Rule dependencies."""

from collections.abc import Sequence
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Query
from sqlmodel import select

from app.db.models.rule import Rule
from app.dependencies import SessionDep


def get_rules_by_ids(
    rule_ids: Annotated[list[UUID] | None, Query()],
    session: SessionDep,
) -> Sequence[Rule]:
    """Get rules by their IDs in a single query."""
    if not rule_ids:
        return []

    stmt = select(Rule).where(Rule.id.in_(rule_ids))  # type: ignore[attr-defined]
    return session.scalars(stmt).all()


RulesDep = Annotated[Sequence[Rule], Depends(get_rules_by_ids)]
