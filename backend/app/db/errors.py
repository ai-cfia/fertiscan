"""Database exception handling.

FastAPI exception handlers for SQLAlchemy exceptions.
"""

import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def _log_and_respond(detail: str, status_code: int, exc: Exception) -> JSONResponse:
    logger.error("Database exception", exc_info=exc)
    return JSONResponse(status_code=status_code, content={"detail": detail})


async def operational_error_handler(_: Request, exc: Exception) -> JSONResponse:
    return _log_and_respond(
        "Database operation failed",
        status.HTTP_503_SERVICE_UNAVAILABLE,
        exc,
    )


async def programming_error_handler(_: Request, exc: Exception) -> JSONResponse:
    return _log_and_respond(
        "Database query error",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        exc,
    )


async def data_error_handler(_: Request, exc: Exception) -> JSONResponse:
    return _log_and_respond(
        "Invalid data provided",
        status.HTTP_400_BAD_REQUEST,
        exc,
    )


async def integrity_error_handler(_: Request, exc: Exception) -> JSONResponse:
    return _log_and_respond(
        "Database constraint violation",
        status.HTTP_400_BAD_REQUEST,
        exc,
    )


async def database_error_handler(_: Request, exc: Exception) -> JSONResponse:
    return _log_and_respond(
        "Database error occurred",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        exc,
    )
