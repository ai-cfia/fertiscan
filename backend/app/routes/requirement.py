"""Routes for Requirement"""

from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi_pagination import LimitOffsetPage
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import requirement as requirement_controller
from app.dependencies import (
    CurrentUser,
    LimitOffsetParamsDep,
    SessionDep,
)
from app.exceptions import RequirementNotFound
from app.schemas.requirement import RequirementParams, RequirementPublic

router = APIRouter(prefix="/requirements", tags=["requirements"])


@router.get("", response_model=LimitOffsetPage[RequirementPublic])
def read_requirements(
    session: SessionDep,
    _: CurrentUser,
    params: LimitOffsetParamsDep,
    filters: RequirementParams = Depends(),
) -> LimitOffsetPage[RequirementPublic]:
    """List requirements with optional filters."""

    rules = requirement_controller.get_rules_query(**filters.model_dump())
    return paginate(session, rules, params)  # type: ignore[no-any-return, arg-type]


@router.get("/{requirement_id}", response_model=RequirementPublic)
def read_requirement_by_id(
    requirement_id: UUID,
    session: SessionDep,
    _: CurrentUser,
) -> RequirementPublic:
    """Get requirement by ID."""
    if not (
        requirement := requirement_controller.get_requirement_by_id(
            session=session,
            requirement_id=requirement_id,
        )
    ):
        raise RequirementNotFound(requirement_id=str(requirement_id))
    return requirement  # type: ignore[return-value]
