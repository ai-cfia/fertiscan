"""Rule dependencies."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Query
from sqlmodel import select

from app.db.models.rule import Rule
from app.dependencies import SessionDep
from app.exceptions import RuleNotFound


def get_rule_by_reference_number(
    rule_ids: Annotated[list[UUID] | None, Query()],
    session: SessionDep,
) -> list[Rule]:
    """Get rule by reference number."""

    rules = []

    for rule_id in rule_ids or []:
        stmt = select(Rule).where(Rule.id == rule_id)

        rule = session.scalars(stmt).first()

        if rule is None:
            raise RuleNotFound(rule_id=str(rule_id))

        rules.append(rule)
    return rules


RulesDep = Annotated[list[Rule], Depends(get_rule_by_reference_number)]
