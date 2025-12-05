"""Backend pre-start tests."""

from unittest.mock import AsyncMock, MagicMock, patch

from app.backend_pre_start import init, logger, main


async def test_init_successful_connection() -> None:
    """Test init successfully connects to database."""
    engine_mock = MagicMock()
    conn_mock = AsyncMock()
    conn_mock.__aenter__ = AsyncMock(return_value=conn_mock)
    conn_mock.__aexit__ = AsyncMock(return_value=None)
    engine_mock.connect.return_value = conn_mock
    with (
        patch("app.backend_pre_start.get_async_engine", return_value=engine_mock),
        patch.object(logger, "info"),
        patch.object(logger, "error"),
        patch.object(logger, "warn"),
    ):
        await init()
        conn_mock.execute.assert_called_once()


async def test_main() -> None:
    """Test main function."""
    with (
        patch("app.backend_pre_start.init", new_callable=AsyncMock),
        patch.object(logger, "info") as mock_info,
    ):
        await main()
        assert mock_info.call_count == 2
