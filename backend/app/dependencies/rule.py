"""Rule dependencies."""

from collections.abc import Sequence
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Query
from sqlmodel import select

from app.db.models.rule import Rule
from app.dependencies import SessionDep
from app.exceptions import RuleNotFound


def get_rules_by_ids(
    rule_ids: Annotated[list[UUID] | None, Query()],
    session: SessionDep,
) -> Sequence[Rule]:
    """Get rules by their IDs in a single query."""
    if not rule_ids:
        return []

    stmt = select(Rule).where(Rule.id.in_(rule_ids))  # type: ignore[attr-defined]
    return session.scalars(stmt).all()


RulesDep = Annotated[list[Rule], Depends(get_rules_by_ids)]


def get_rule_by_id(
    rule_id: UUID,
    session: SessionDep,
) -> Rule:
    """Get rule by reference number."""

    stmt = select(Rule).where(Rule.id == rule_id)

    rule = session.scalars(stmt).first()

    if rule is None:
        raise RuleNotFound(rule_id=str(rule_id))

    return rule


RuleDep = Annotated[Rule, Depends(get_rule_by_id)]
