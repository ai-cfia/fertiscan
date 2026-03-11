"""Application configuration and settings."""

import json
import logging
import secrets
import warnings
from pathlib import Path
from typing import Annotated, Any, Literal, Self

from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from pydantic import (
    BeforeValidator,
    EmailStr,
    SecretStr,
    computed_field,
    field_validator,
    model_validator,
)
from pydantic.networks import AnyUrl, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


def parse_list(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_ignore_empty=True, extra="ignore")
    PROJECT_NAME: str = "FertiScan"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: SecretStr = SecretStr(secrets.token_urlsafe(32))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    EMAIL_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    EMAIL_TEMPLATES_DIR: str = "app/email-templates/build"
    ENVIRONMENT: Literal["local", "staging", "production", "testing"] = "local"
    LOG_LEVEL: int = logging.INFO
    USE_MOCKED_STORAGE: bool = True
    FRONTEND_HOST: str = "http://localhost:3000"
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_list)
    ] = []
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: SecretStr | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str
    POSTGRES_PASSWORD: SecretStr = SecretStr("")
    POSTGRES_DB: str = ""
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: SecretStr
    LOG_SQL: bool = False
    STORAGE_ENDPOINT: str
    STORAGE_BUCKET_NAME: str
    STORAGE_REGION: str | None = None
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: SecretStr
    PRESIGNED_UPLOAD_URL_EXPIRY_MINUTES: int = 10
    PRESIGNED_DOWNLOAD_URL_EXPIRY_MINUTES: int = 20
    MAX_IMAGES_PER_LABEL: int = 5
    AZURE_OPENAI_ENDPOINT: str | None = None
    AZURE_OPENAI_API_KEY: SecretStr | None = None
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"
    AZURE_OPENAI_MODEL: str = "gpt-4o"
    AZURE_OPENAI_IMAGE_DETAIL: Literal["auto", "low", "high"] = "auto"
    COMPLIANCE_SEED_DATA_DIR: str = "app/data"
    PROMPT_TEMPLATES_DIR: str = "app/prompt_templates"
    COMPLIANCE_PROMPT_TEMPLATE: str = "compliance_verification.md"

    @field_validator("LOG_LEVEL", mode="before")
    @classmethod
    def parse_log_level(cls, v: str | int) -> int:
        if isinstance(v, int):
            return v
        level_map = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARNING": logging.WARNING,
            "ERROR": logging.ERROR,
            "CRITICAL": logging.CRITICAL,
        }
        return level_map.get(str(v).upper(), logging.INFO)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD.get_secret_value() or None,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def email_template_env(self) -> Environment:
        return Environment(
            loader=FileSystemLoader(self.EMAIL_TEMPLATES_DIR), autoescape=True
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def storage_endpoint_url(self) -> str:
        """Storage endpoint URL with scheme based on environment."""
        scheme = "https" if self.ENVIRONMENT in ("production", "staging") else "http"
        return f"{scheme}://{self.STORAGE_ENDPOINT}"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def prompt_template_env(self) -> Environment:
        return Environment(
            loader=FileSystemLoader(self.PROMPT_TEMPLATES_DIR), autoescape=True
        )

    @model_validator(mode="after")
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    def _check_default_secret(
        self, var_name: str, value: str | SecretStr | None
    ) -> None:
        secret_value = (
            value.get_secret_value() if isinstance(value, SecretStr) else value
        )
        if secret_value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT in ("local", "testing"):
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )
        self._check_default_secret("MINIO_ROOT_PASSWORD", self.MINIO_ROOT_PASSWORD)
        return self

    def compliance_seed_data(self) -> dict[str, Any]:
        """Load compliance seed data from multiple files."""
        seed_dir = Path(self.COMPLIANCE_SEED_DATA_DIR)
        data = {  # type: ignore[var-annotated]
            "legislations": [],
            "provisions": [],
            "definitions": [],
            "requirements": [],
        }

        if not seed_dir.exists():
            return data

        file_map = {
            "legislations": "legislations.json",
            "provisions": "provisions.json",
            "definitions": "definitions.json",
            "requirements": "requirements.json",
        }

        for key, filename in file_map.items():
            file_path = seed_dir / filename
            if file_path.exists():
                with file_path.open("r", encoding="utf-8") as f:
                    data[key] = json.load(f)

        return data


settings = Settings()  # type: ignore
