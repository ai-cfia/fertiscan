"""Backend pre-start tests."""

from io import BytesIO
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

import pytest
from pydantic import SecretStr

from app.backend_pre_start import check_db, check_llm, check_storage, logger, main
from app.config import settings


def test_check_db_successful_connection() -> None:
    """Test check_db successfully connects to database."""
    engine_mock = MagicMock()
    conn_mock = MagicMock()
    conn_mock.__enter__ = MagicMock(return_value=conn_mock)
    conn_mock.__exit__ = MagicMock(return_value=None)
    engine_mock.connect.return_value = conn_mock
    with (
        patch("app.backend_pre_start.get_engine", return_value=engine_mock),
        patch.object(logger, "info"),
        patch.object(logger, "error"),
        patch.object(logger, "warn"),
    ):
        check_db()
        conn_mock.execute.assert_called_once()


def test_check_storage_connectivity() -> None:
    """Test check_storage connectivity check."""
    s3_client_mock = MagicMock()
    s3_client_mock.list_buckets = MagicMock()
    with patch("app.backend_pre_start.boto3.client", return_value=s3_client_mock):
        check_storage()
        s3_client_mock.list_buckets.assert_called_once()


def test_check_llm_reachability() -> None:
    """Test Azure OpenAI reachability check lists deployments."""
    response_mock = MagicMock()
    response_mock.__enter__.return_value = response_mock
    response_mock.__exit__.return_value = None
    response_mock.read.return_value = b'{"data":[{"id":"gpt-4o"}]}'

    with (
        patch.object(
            settings, "AZURE_OPENAI_ENDPOINT", "https://example.openai.azure.com"
        ),
        patch.object(settings, "AZURE_OPENAI_API_KEY", SecretStr("test-key")),
        patch.object(settings, "AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
        patch.object(settings, "AZURE_OPENAI_MODEL", "gpt-4o"),
        patch(
            "app.backend_pre_start.urlopen", return_value=response_mock
        ) as urlopen_mock,
    ):
        check_llm()

    request = urlopen_mock.call_args.args[0]
    assert request.full_url == (
        "https://example.openai.azure.com/openai/deployments"
        "?api-version=2024-02-15-preview"
    )
    assert request.headers["Api-key"] == "test-key"


def test_check_llm_missing_config() -> None:
    """Test missing Azure OpenAI settings fail prestart clearly."""
    with (
        patch.object(settings, "AZURE_OPENAI_ENDPOINT", None),
        patch.object(settings, "AZURE_OPENAI_API_KEY", None),
        pytest.raises(RuntimeError, match="Azure OpenAI is not configured"),
    ):
        check_llm()


def test_check_llm_missing_deployment() -> None:
    """Test missing Azure OpenAI deployment fails prestart clearly."""
    response_mock = MagicMock()
    response_mock.__enter__.return_value = response_mock
    response_mock.__exit__.return_value = None
    response_mock.read.return_value = b'{"data":[{"id":"other-deployment"}]}'

    with (
        patch.object(
            settings, "AZURE_OPENAI_ENDPOINT", "https://example.openai.azure.com"
        ),
        patch.object(settings, "AZURE_OPENAI_API_KEY", SecretStr("test-key")),
        patch.object(settings, "AZURE_OPENAI_MODEL", "gpt-4o"),
        patch("app.backend_pre_start.urlopen", return_value=response_mock),
        pytest.raises(RuntimeError, match="deployment 'gpt-4o' was not found"),
    ):
        check_llm()


def test_check_llm_http_error() -> None:
    """Test Azure OpenAI HTTP errors identify the failing dependency."""
    error = HTTPError(
        url="https://example.openai.azure.com/openai/deployments",
        code=401,
        msg="Unauthorized",
        hdrs=None,
        fp=BytesIO(b'{"error":"bad key"}'),
    )

    with (
        patch.object(
            settings, "AZURE_OPENAI_ENDPOINT", "https://example.openai.azure.com"
        ),
        patch.object(settings, "AZURE_OPENAI_API_KEY", SecretStr("test-key")),
        patch.object(settings, "AZURE_OPENAI_MODEL", "gpt-4o"),
        patch("app.backend_pre_start.urlopen", side_effect=error),
        pytest.raises(RuntimeError, match="Azure OpenAI reachability check failed"),
    ):
        check_llm()


def test_main() -> None:
    """Test main function."""
    with (
        patch("app.backend_pre_start.check_db"),
        patch("app.backend_pre_start.check_storage"),
        patch("app.backend_pre_start.check_llm"),
        patch.object(logger, "info") as mock_info,
    ):
        main()
        assert mock_info.call_count == 2
