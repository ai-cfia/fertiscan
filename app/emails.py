"""Email functionality."""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

import aiosmtplib
from pydantic import EmailStr, validate_call

from app.config import settings
from app.schemas.email import EmailData

logger = logging.getLogger(__name__)


@validate_call
async def send_email(email_to: EmailStr, email_data: EmailData) -> None:
    """Send email via SMTP."""
    if not settings.emails_enabled:
        logger.info(f"Emails disabled - would send to {email_to}: {email_data.subject}")
        return
    message = MIMEMultipart()
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to
    message["Subject"] = email_data.subject
    message.attach(MIMEText(email_data.html_content, "html"))
    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        use_tls=settings.SMTP_TLS,
        start_tls=settings.SMTP_TLS and not settings.SMTP_SSL,
    )
    logger.info(f"Email sent to {email_to}: {email_data.subject}")


@validate_call
def render_email_template(template_name: str, context: dict[str, Any]) -> str:
    """Render email template using Jinja2."""
    template = settings.email_template_env.get_template(template_name)
    return template.render(context)


@validate_call
def generate_new_account_email(
    email_to: EmailStr, username: str, token: str
) -> EmailData:
    """Generate new account email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": project_name,
            "username": username,
            "email": email_to,
            "valid_minutes": settings.EMAIL_RESET_TOKEN_EXPIRE_MINUTES,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


@validate_call
def generate_reset_password_email(
    email_to: EmailStr, email: EmailStr, token: str
) -> EmailData:
    """Generate password reset email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": project_name,
            "username": email,
            "email": email_to,
            "valid_minutes": settings.EMAIL_RESET_TOKEN_EXPIRE_MINUTES,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


@validate_call
def generate_test_email(email_to: EmailStr) -> EmailData:
    """Generate test email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    html_content = render_email_template(
        template_name="test_email.html",
        context={
            "project_name": project_name,
            "email": email_to,
        },
    )
    return EmailData(html_content=html_content, subject=subject)
