"""Backend pre-start tests."""

from unittest.mock import MagicMock, patch

from app.backend_pre_start import init, logger, main


def test_init_successful_connection() -> None:
    """Test init successfully connects to database."""
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
        init()
        conn_mock.execute.assert_called_once()


def test_main() -> None:
    """Test main function."""
    with (
        patch("app.backend_pre_start.init"),
        patch.object(logger, "info") as mock_info,
    ):
        main()
        assert mock_info.call_count == 2
