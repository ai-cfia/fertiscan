"""Routes for Legislation"""

from fastapi import APIRouter

from app.dependencies import CurrentUser, ProductQueryTypeDep
from app.schemas.legislation import LegislationPublic

router = APIRouter(prefix="/legislations", tags=["legislations"])


@router.get("", response_model=list[LegislationPublic])
def read_legislations(
    _: CurrentUser,
    product_type: ProductQueryTypeDep,
) -> list[LegislationPublic]:
    """List legislations for the given product type."""
    return product_type.legislations  # type: ignore[return-value]
