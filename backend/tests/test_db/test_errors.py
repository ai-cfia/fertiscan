"""Database exception handler tests."""

import json
import logging
from unittest.mock import MagicMock

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
    @pytest.mark.asyncio
    async def test_operational_error_handler(self) -> None:
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("connection to server failed")
        mock_exc = OperationalError("Connection failed", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await operational_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        content = json.loads(bytes(response.body).decode())
        assert content == {"detail": "Database operation failed"}

    @pytest.mark.asyncio
    async def test_logs_exception_with_traceback(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("FATAL: too many clients already")
        mock_exc = OperationalError("Connection failed", None, orig_exc)
        mock_exc.orig = orig_exc
        with caplog.at_level(logging.ERROR, logger="app.db.errors"):
            await operational_error_handler(mock_request, mock_exc)
        record = caplog.records[-1]
        assert record.levelno == logging.ERROR
        assert record.exc_info is not None
        assert record.exc_info[1] is mock_exc


class TestProgrammingErrorHandler:
    @pytest.mark.asyncio
    async def test_programming_error_handler(self) -> None:
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("syntax error at or near")
        mock_exc = ProgrammingError("Syntax error", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await programming_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        content = json.loads(bytes(response.body).decode())
        assert content == {"detail": "Database query error"}


class TestDataErrorHandler:
    @pytest.mark.asyncio
    async def test_data_error_handler(self) -> None:
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("numeric value out of range")
        mock_exc = DataError("Invalid data", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await data_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        content = json.loads(bytes(response.body).decode())
        assert content == {"detail": "Invalid data provided"}


class TestIntegrityErrorHandler:
    @pytest.mark.asyncio
    async def test_integrity_error_handler(self) -> None:
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("duplicate key value violates unique constraint")
        mock_exc = IntegrityError("Constraint violation", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await integrity_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        content = json.loads(bytes(response.body).decode())
        assert content == {"detail": "Database constraint violation"}


class TestDatabaseErrorHandler:
    @pytest.mark.asyncio
    async def test_database_error_handler(self) -> None:
        mock_request = MagicMock(spec=Request)
        orig_exc = Exception("unknown database error")
        mock_exc = DatabaseError("Database error", None, orig_exc)
        mock_exc.orig = orig_exc
        response = await database_error_handler(mock_request, mock_exc)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        content = json.loads(bytes(response.body).decode())
        assert content == {"detail": "Database error occurred"}
