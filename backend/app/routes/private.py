"""Private development endpoints - only available in local environment."""

from fastapi import APIRouter

from app.controllers import users
from app.dependencies import PrivateUserCreateDep, SessionDep
from app.schemas.user import UserPublic

router = APIRouter(tags=["private"], prefix="/private")


@router.post("/users/", response_model=UserPublic)
def create_user_no_verification(
    session: SessionDep,
    user_create: PrivateUserCreateDep,
) -> UserPublic:
    """Create user without email verification - for testing only."""
    return users.create_user(session, user_create)  # type: ignore[return-value]
