"""Login routes."""

from datetime import timedelta

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from app.config import settings
from app.controllers import users
from app.core import security
from app.dependencies import (
    CurrentSuperuser,
    CurrentUser,
    LoginUserDep,
    SessionDep,
    UserByEmailDep,
    UserForResetPasswordDep,
)
from app.emails import generate_reset_password_email, send_email
from app.schemas.auth import NewPassword, Token
from app.schemas.message import Message
from app.schemas.user import UserPublic, UserUpdate

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
def login_access_token(user: LoginUserDep) -> Token:
    """OAuth2 compatible token login, get an access token for future requests."""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            str(user.id),
            expires_delta=access_token_expires,
        )
    )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> UserPublic:
    """Test access token."""
    return current_user  # type: ignore[return-value]


@router.post("/password-recovery/{email}")
async def recover_password(
    user: UserByEmailDep,
    _: SessionDep,
) -> Message:
    """Password Recovery."""
    password_reset_token = security.generate_password_reset_token(user.email)
    if settings.emails_enabled:
        email_data = generate_reset_password_email(
            email_to=user.email,
            email=user.email,
            token=password_reset_token,
        )
        await send_email(email_to=user.email, email_data=email_data)
    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
def reset_password(
    session: SessionDep,
    user: UserForResetPasswordDep,
    new_password: NewPassword,
) -> Message:
    """Reset password."""
    users.update_user(session, user, UserUpdate(password=new_password.new_password))
    return Message(message="Password updated successfully")


@router.post("/password-recovery-html-content/{email}", response_class=HTMLResponse)
def recover_password_html_content(
    user: UserByEmailDep,
    _: CurrentSuperuser,
) -> HTMLResponse:
    """HTML Content for Password Recovery (dev/testing only)."""
    password_reset_token = security.generate_password_reset_token(user.email)
    email_data = generate_reset_password_email(
        email_to=user.email,
        email=user.email,
        token=password_reset_token,
    )
    return HTMLResponse(
        content=email_data.html_content,
        headers={"subject": email_data.subject},
    )
