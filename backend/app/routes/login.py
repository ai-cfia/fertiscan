"""Login routes."""

from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import SecretStr

from app.config import settings
from app.controllers import users
from app.core import security
from app.dependencies import CurrentSuperuser, CurrentUser, SessionDep
from app.emails import generate_reset_password_email, send_email
from app.schemas.auth import NewPassword, Token
from app.schemas.message import Message
from app.schemas.user import UserPublic, UserUpdate

router = APIRouter(tags=["login"])


class IncorrectEmailOrPassword(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "Incorrect email or password")


class InactiveUser(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "Inactive user")


class UserNotFound(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status.HTTP_404_NOT_FOUND,
            "The user with this email does not exist in the system.",
        )


class InvalidToken(HTTPException):
    def __init__(self) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, "Invalid token")


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """OAuth2 compatible token login, get an access token for future requests."""
    if not (
        user := users.authenticate(
            session,
            form_data.username,
            SecretStr(form_data.password),
        )
    ):
        raise IncorrectEmailOrPassword()
    elif not user.is_active:
        raise InactiveUser()
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            str(user.id),
            expires_delta=access_token_expires,
        )
    )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(
    current_user: CurrentUser,
) -> Any:
    """Test access token."""
    return current_user


@router.post("/password-recovery/{email}")
async def recover_password(
    email: str,
    session: SessionDep,
) -> Message:
    """Password Recovery."""
    if not (user := users.get_user_by_email(session, email)):
        raise UserNotFound()
    password_reset_token = security.generate_password_reset_token(email)
    if settings.emails_enabled:
        email_data = generate_reset_password_email(
            email_to=user.email,
            email=email,
            token=password_reset_token,
        )
        await send_email(email_to=user.email, email_data=email_data)
    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
def reset_password(
    session: SessionDep,
    body: NewPassword,
) -> Message:
    """Reset password."""
    if not (email := security.verify_password_reset_token(body.token)):
        raise InvalidToken()
    if not (user := users.get_user_by_email(session, email)):
        raise UserNotFound()
    elif not user.is_active:
        raise InactiveUser()
    if not users.update_user(session, user.id, UserUpdate(password=body.new_password)):
        raise UserNotFound()
    return Message(message="Password updated successfully")


@router.post("/password-recovery-html-content/{email}", response_class=HTMLResponse)
def recover_password_html_content(
    email: str,
    session: SessionDep,
    _: CurrentSuperuser,
) -> Any:
    """HTML Content for Password Recovery (dev/testing only)."""
    if not users.get_user_by_email(session, email):
        raise UserNotFound()
    password_reset_token = security.generate_password_reset_token(email)
    email_data = generate_reset_password_email(
        email_to=email,
        email=email,
        token=password_reset_token,
    )
    return HTMLResponse(
        content=email_data.html_content,
        headers={"subject": email_data.subject},
    )
