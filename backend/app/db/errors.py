"""Database exception handling.

FastAPI exception handlers for SQLAlchemy exceptions.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.config import settings


def _build_error_response(
    detail: str, status_code: int, exc: Exception
) -> JSONResponse:
    """Build error response with optional debug info in development."""
    content = {"detail": detail}
    if settings.ENVIRONMENT in ("local", "testing"):
        content["debug"] = str(exc.orig) if hasattr(exc, "orig") else str(exc)
    return JSONResponse(status_code=status_code, content=content)


async def operational_error_handler(_: Request, exc: Exception) -> JSONResponse:
    """Handle OperationalError (connection/operational issues)."""
    return _build_error_response(
        "Database operation failed",
        status.HTTP_503_SERVICE_UNAVAILABLE,
        exc,
    )


async def programming_error_handler(_: Request, exc: Exception) -> JSONResponse:
    """Handle ProgrammingError (SQL syntax/query errors)."""
    return _build_error_response(
        "Database query error",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        exc,
    )


async def data_error_handler(_: Request, exc: Exception) -> JSONResponse:
    """Handle DataError (data type/format errors)."""
    return _build_error_response(
        "Invalid data provided",
        status.HTTP_400_BAD_REQUEST,
        exc,
    )


async def integrity_error_handler(_: Request, exc: Exception) -> JSONResponse:
    """Handle IntegrityError (constraint violations)."""
    return _build_error_response(
        "Database constraint violation",
        status.HTTP_400_BAD_REQUEST,
        exc,
    )


async def database_error_handler(_: Request, exc: Exception) -> JSONResponse:
    """Handle DatabaseError (catch-all for unhandled DBAPI errors)."""
    return _build_error_response(
        "Database error occurred",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        exc,
    )
