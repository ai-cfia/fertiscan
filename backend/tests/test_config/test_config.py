"""Configuration tests."""

import os
import warnings
from unittest.mock import patch

import pytest

from app.config import Settings, parse_list


class TestParseList:
    def test_comma_separated_string(self) -> None:
        result = parse_list("a, b, c")
        assert result == ["a", "b", "c"]

    def test_string_list_format(self) -> None:
        result = parse_list("[a, b, c]")
        assert result == "[a, b, c]"

    def test_list_input(self) -> None:
        result = parse_list(["a", "b", "c"])
        assert result == ["a", "b", "c"]

    def test_single_string_input(self) -> None:
        result = parse_list("single_string")
        assert isinstance(result, list)
        assert result == ["single_string"]

    def test_invalid_input_raises(self) -> None:
        with pytest.raises(ValueError):
            parse_list(123)


class TestParseLogLevel:
    def test_int_input(self) -> None:
        result = Settings.parse_log_level(20)
        assert result == 20

    def test_string_input(self) -> None:
        result = Settings.parse_log_level("DEBUG")
        assert result == 10


class TestSqlAlchemyDatabaseUri:
    def test_computed_property(self) -> None:
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


class TestEmailsFromName:
    def test_sets_default_when_none(self) -> None:
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


class TestCheckDefaultSecret:
    def test_local_warning(self) -> None:
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

    def test_production_error(self) -> None:
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

    def test_non_default_value(self) -> None:
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
