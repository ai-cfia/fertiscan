from fastapi import APIRouter, Depends
from fastapi_pagination import LimitOffsetPage
from fastapi_pagination.ext.sqlmodel import paginate

from app.controllers import rule as rule_controller
from app.dependencies import (
    CurrentUser,
    LimitOffsetParamsDep,
    SessionDep,
)
from app.schemas.rule import RuleParams, RulePublic

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("", response_model=LimitOffsetPage[RulePublic])
def read_rules(
    session: SessionDep,
    _: CurrentUser,
    param: LimitOffsetParamsDep,
    filters: RuleParams = Depends(),
) -> LimitOffsetPage[RulePublic]:
    """List rules with optional filters."""

    rules = rule_controller.get_rules_query(**filters.model_dump())
    return paginate(session, rules, param)
