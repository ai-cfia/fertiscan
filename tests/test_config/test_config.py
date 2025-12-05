"""Configuration tests."""

import os
import warnings
from unittest.mock import patch

import pytest

from app.config import Settings, parse_list


def test_parse_list_string_comma_separated() -> None:
    """Test parse_list with comma-separated string."""
    result = parse_list("a, b, c")
    assert result == ["a", "b", "c"]


def test_parse_list_string_list_format() -> None:
    """Test parse_list with string that starts with '['."""
    result = parse_list("[a, b, c]")
    assert result == "[a, b, c]"


def test_parse_list_list_input() -> None:
    """Test parse_list with list input."""
    result = parse_list(["a", "b", "c"])
    assert result == ["a", "b", "c"]


def test_parse_list_string_input() -> None:
    """Test parse_list with string input (not comma-separated)."""
    result = parse_list("single_string")
    assert isinstance(result, list)
    assert result == ["single_string"]


def test_parse_list_invalid_input() -> None:
    """Test parse_list raises ValueError for invalid input."""
    with pytest.raises(ValueError):
        parse_list(123)


def test_parse_log_level_int() -> None:
    """Test parse_log_level with integer input."""
    result = Settings.parse_log_level(20)
    assert result == 20


def test_parse_log_level_string() -> None:
    """Test parse_log_level with string input."""
    result = Settings.parse_log_level("DEBUG")
    assert result == 10


def test_sqlalchemy_database_uri() -> None:
    """Test SQLALCHEMY_DATABASE_URI computed property."""
    with patch.dict(
        os.environ,
        {
            "POSTGRES_SERVER": "localhost",
            "POSTGRES_USER": "testuser",
            "POSTGRES_PASSWORD": "testpass",
            "POSTGRES_DB": "testdb",
            "FIRST_SUPERUSER": "admin@test.com",
            "FIRST_SUPERUSER_PASSWORD": "adminpass",
        },
    ):
        settings = Settings()  # type: ignore[call-arg]
        uri = settings.SQLALCHEMY_DATABASE_URI
        assert str(uri).startswith("postgresql+psycopg://")
        assert "testuser" in str(uri)
        assert "localhost" in str(uri)
        assert "testdb" in str(uri)


def test_log_sql_local() -> None:
    """Test LOG_SQL computed property for local environment."""
    with patch.dict(
        os.environ,
        {
            "ENVIRONMENT": "local",
            "POSTGRES_SERVER": "localhost",
            "POSTGRES_USER": "testuser",
            "FIRST_SUPERUSER": "admin@test.com",
            "FIRST_SUPERUSER_PASSWORD": "adminpass",
        },
    ):
        settings = Settings()  # type: ignore[call-arg]
        assert settings.LOG_SQL is True


def test_log_sql_testing() -> None:
    """Test LOG_SQL computed property for testing environment."""
    with patch.dict(
        os.environ,
        {
            "ENVIRONMENT": "testing",
            "POSTGRES_SERVER": "localhost",
            "POSTGRES_USER": "testuser",
            "FIRST_SUPERUSER": "admin@test.com",
            "FIRST_SUPERUSER_PASSWORD": "adminpass",
        },
    ):
        settings = Settings()  # type: ignore[call-arg]
        assert settings.LOG_SQL is True


def test_log_sql_production() -> None:
    """Test LOG_SQL computed property for production environment."""
    with patch.dict(
        os.environ,
        {
            "ENVIRONMENT": "production",
            "POSTGRES_SERVER": "localhost",
            "POSTGRES_USER": "testuser",
            "POSTGRES_PASSWORD": "testpassword",
            "FIRST_SUPERUSER": "admin@test.com",
            "FIRST_SUPERUSER_PASSWORD": "adminpass",
        },
    ):
        settings = Settings()  # type: ignore[call-arg]
        assert settings.LOG_SQL is False


def test_set_default_emails_from_name() -> None:
    """Test _set_default_emails_from sets EMAILS_FROM_NAME when None."""
    with patch.dict(
        os.environ,
        {
            "POSTGRES_SERVER": "localhost",
            "POSTGRES_USER": "testuser",
            "FIRST_SUPERUSER": "admin@test.com",
            "FIRST_SUPERUSER_PASSWORD": "adminpass",
        },
    ):
        settings = Settings(EMAILS_FROM_NAME=None)  # type: ignore[call-arg]
        assert settings.EMAILS_FROM_NAME == settings.PROJECT_NAME


def test_check_default_secret_local_warning() -> None:
    """Test _check_default_secret warns in local environment."""
    with patch.dict(
        os.environ,
        {
            "ENVIRONMENT": "local",
            "POSTGRES_SERVER": "localhost",
            "POSTGRES_USER": "testuser",
            "FIRST_SUPERUSER": "admin@test.com",
            "FIRST_SUPERUSER_PASSWORD": "adminpass",
        },
    ):
        settings = Settings()  # type: ignore[call-arg]
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            settings._check_default_secret("TEST_VAR", "changethis")
            assert len(w) == 1
            assert "changethis" in str(w[0].message).lower()


def test_check_default_secret_production_error() -> None:
    """Test _check_default_secret raises ValueError in production."""
    with patch.dict(
        os.environ,
        {
            "ENVIRONMENT": "production",
            "POSTGRES_SERVER": "localhost",
            "POSTGRES_USER": "testuser",
            "POSTGRES_PASSWORD": "testpassword",
            "FIRST_SUPERUSER": "admin@test.com",
            "FIRST_SUPERUSER_PASSWORD": "adminpass",
        },
    ):
        settings = Settings()  # type: ignore[call-arg]
        with pytest.raises(ValueError, match="changethis"):
            settings._check_default_secret("TEST_VAR", "changethis")


def test_check_default_secret_non_default() -> None:
    """Test _check_default_secret does nothing for non-default values."""
    with patch.dict(
        os.environ,
        {
            "POSTGRES_SERVER": "localhost",
            "POSTGRES_USER": "testuser",
            "FIRST_SUPERUSER": "admin@test.com",
            "FIRST_SUPERUSER_PASSWORD": "adminpass",
        },
    ):
        settings = Settings()  # type: ignore[call-arg]
        settings._check_default_secret("TEST_VAR", "notchangethis")
