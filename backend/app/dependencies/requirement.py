"""Requirement dependencies."""

from collections.abc import Sequence
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Query
from sqlmodel import select

from app.db.models.requirement import Requirement
from app.dependencies.session import SessionDep
from app.exceptions import RequirementNotFound


def get_requirements_by_ids(
    requirement_ids: Annotated[list[UUID] | None, Query()],
    session: SessionDep,
) -> Sequence[Requirement]:
    """Get requirements by their IDs in a single query."""
    if not requirement_ids:
        return []

    stmt = select(Requirement).where(Requirement.id.in_(requirement_ids))  # type: ignore[attr-defined]
    return session.scalars(stmt).all()


RequirementsDep = Annotated[list[Requirement], Depends(get_requirements_by_ids)]


def get_requirement_by_id(
    requirement_id: UUID,
    session: SessionDep,
) -> Requirement:
    """Get requirement by reference number."""
    stmt = select(Requirement).where(Requirement.id == requirement_id)
    if (requirement := session.scalars(stmt).first()) is None:
        raise RequirementNotFound(requirement_id=str(requirement_id))
    return requirement


RequirementDep = Annotated[Requirement, Depends(get_requirement_by_id)]
