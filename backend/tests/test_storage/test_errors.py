"""Storage exception handler tests."""

import json
from typing import Any, cast
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError
from fastapi import Request, status

from app.storage.errors import storage_error_handler


def _create_client_error(error_code: str) -> ClientError:
    """Create a mock ClientError with the given error code."""
    error_response: dict[str, dict[str, str]] = {
        "Error": {
            "Code": error_code,
            "Message": f"Test error: {error_code}",
        }
    }
    operation_name = "TestOperation"
    return ClientError(cast(Any, error_response), operation_name)


class TestStorageErrorHandler:
    """Tests for storage error handler."""

    @pytest.mark.asyncio
    async def test_access_denied_returns_403(self) -> None:
        """Test AccessDenied error returns 403."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("AccessDenied")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Storage access denied"

    @pytest.mark.asyncio
    async def test_forbidden_returns_403(self) -> None:
        """Test Forbidden error returns 403."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("Forbidden")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_invalid_access_key_returns_403(self) -> None:
        """Test InvalidAccessKeyId error returns 403."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("InvalidAccessKeyId")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_no_such_key_returns_404(self) -> None:
        """Test NoSuchKey error returns 404."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("NoSuchKey")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Storage resource not found"

    @pytest.mark.asyncio
    async def test_no_such_bucket_returns_404(self) -> None:
        """Test NoSuchBucket error returns 404."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("NoSuchBucket")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_slow_down_returns_503(self) -> None:
        """Test SlowDown error returns 503."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("SlowDown")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Storage service temporarily unavailable"

    @pytest.mark.asyncio
    async def test_service_unavailable_returns_503(self) -> None:
        """Test ServiceUnavailable error returns 503."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("ServiceUnavailable")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

    @pytest.mark.asyncio
    async def test_invalid_request_returns_400(self) -> None:
        """Test InvalidRequest error returns 400."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("InvalidRequest")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Invalid storage request"

    @pytest.mark.asyncio
    async def test_unknown_error_returns_500(self) -> None:
        """Test unknown error code returns 500."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("UnknownError")
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        content = json.loads(bytes(response.body).decode())
        assert content["detail"] == "Storage operation failed"

    @pytest.mark.asyncio
    async def test_error_without_response(self) -> None:
        """Test error without response attribute returns 500."""
        mock_request = MagicMock(spec=Request)
        exc = ClientError(cast(Any, {}), "TestOperation")
        object.__setattr__(exc, "response", None)
        response = await storage_error_handler(mock_request, exc)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


class TestDebugInfo:
    """Tests for debug info inclusion based on environment."""

    @pytest.mark.asyncio
    @patch("app.storage.errors.settings.ENVIRONMENT", "local")
    async def test_debug_info_in_local(self) -> None:
        """Test debug info is included in local environment."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("AccessDenied")
        response = await storage_error_handler(mock_request, exc)
        content = json.loads(bytes(response.body).decode())
        assert "debug" in content
        assert "AccessDenied" in content["debug"]

    @pytest.mark.asyncio
    @patch("app.storage.errors.settings.ENVIRONMENT", "testing")
    async def test_debug_info_in_testing(self) -> None:
        """Test debug info is included in testing environment."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("SlowDown")
        response = await storage_error_handler(mock_request, exc)
        content = json.loads(bytes(response.body).decode())
        assert "debug" in content

    @pytest.mark.asyncio
    @patch("app.storage.errors.settings.ENVIRONMENT", "production")
    async def test_debug_info_excluded_in_production(self) -> None:
        """Test debug info is excluded in production environment."""
        mock_request = MagicMock(spec=Request)
        exc = _create_client_error("AccessDenied")
        response = await storage_error_handler(mock_request, exc)
        content = json.loads(bytes(response.body).decode())
        assert "debug" not in content
        assert "detail" in content
