"""Backend pre-start tests."""

from unittest.mock import MagicMock, patch

from app.backend_pre_start import check_db, check_storage, logger, main


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


def test_main() -> None:
    """Test main function."""
    with (
        patch("app.backend_pre_start.check_db"),
        patch("app.backend_pre_start.check_storage"),
        patch.object(logger, "info") as mock_info,
    ):
        main()
        assert mock_info.call_count == 2
