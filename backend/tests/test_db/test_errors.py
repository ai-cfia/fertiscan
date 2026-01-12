"""Database exception handler tests."""

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi import Request, status
from sqlalchemy.exc import (
    DatabaseError,
    DataError,
    IntegrityError,
    OperationalError,
    ProgrammingError,
)

from app.db.errors import (
    data_error_handler,
    database_error_handler,
    integrity_error_handler,
    operational_error_handler,
    programming_error_handler,
)


class TestOperationalErrorHandler:
    """Tests for OperationalError handler."""

    @pytest.mark.asyncio
    async def test_operational_error_handler(self) -> None:
        """Test OperationalError handler returns 503."""
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("connection to server failed")
        mock_exc = OperationalError("Connection failed", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await operational_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Database operation failed"

    @pytest.mark.asyncio
    @patch("app.db.errors.settings.ENVIRONMENT", "local")
    async def test_operational_error_handler_with_debug(self) -> None:
        """Test OperationalError handler includes debug info in local env."""
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("connection to server failed")
        mock_exc = OperationalError("Connection failed", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await operational_error_handler(mock_request, mock_exc)
        content = json.loads(bytes(response.body).decode())
        assert "debug" in content
        assert content["debug"] == "connection to server failed"


class TestProgrammingErrorHandler:
    """Tests for ProgrammingError handler."""

    @pytest.mark.asyncio
    async def test_programming_error_handler(self) -> None:
        """Test ProgrammingError handler returns 500."""
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("syntax error at or near")
        mock_exc = ProgrammingError("Syntax error", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await programming_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Database query error"


class TestDataErrorHandler:
    """Tests for DataError handler."""

    @pytest.mark.asyncio
    async def test_data_error_handler(self) -> None:
        """Test DataError handler returns 400."""
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("numeric value out of range")
        mock_exc = DataError("Invalid data", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await data_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Invalid data provided"


class TestIntegrityErrorHandler:
    """Tests for IntegrityError handler."""

    @pytest.mark.asyncio
    async def test_integrity_error_handler(self) -> None:
        """Test IntegrityError handler returns 400."""
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("duplicate key value violates unique constraint")
        mock_exc = IntegrityError("Constraint violation", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await integrity_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Database constraint violation"


class TestDatabaseErrorHandler:
    """Tests for DatabaseError catch-all handler."""

    @pytest.mark.asyncio
    async def test_database_error_handler(self) -> None:
        """Test DatabaseError handler returns 500."""
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("unknown database error")
        mock_exc = DatabaseError("Database error", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await database_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Database error occurred"


class TestDebugInfo:
    """Tests for debug info inclusion based on environment."""

    @pytest.mark.asyncio
    @patch("app.db.errors.settings.ENVIRONMENT", "testing")
    async def test_debug_info_in_testing(self) -> None:
        """Test debug info is included in testing environment."""
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("test debug message")
        mock_exc = OperationalError("Test error", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await operational_error_handler(mock_request, mock_exc)
        content = json.loads(bytes(response.body).decode())
        assert "debug" in content
        assert content["debug"] == "test debug message"

    @pytest.mark.asyncio
    @patch("app.db.errors.settings.ENVIRONMENT", "production")
    async def test_debug_info_excluded_in_production(self) -> None:
        """Test debug info is excluded in production environment."""
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("test debug message")
        mock_exc = OperationalError("Test error", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await operational_error_handler(mock_request, mock_exc)
        content = json.loads(bytes(response.body).decode())
        assert "debug" not in content
        assert "detail" in content
