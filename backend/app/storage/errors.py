"""Storage exception handling.

FastAPI exception handlers for botocore ClientError exceptions.
"""

from typing import cast

from botocore.exceptions import ClientError
from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.config import settings


def _build_error_response(
    detail: str, status_code: int, exc: Exception
) -> JSONResponse:
    """Build error response with optional debug info in development."""
    content = {"detail": detail}
    if settings.ENVIRONMENT in ("local", "testing"):
        error_info = str(exc)
        if hasattr(exc, "response") and exc.response:
            error_info = str(exc.response.get("Error", {}))
        content["debug"] = error_info
    return JSONResponse(status_code=status_code, content=content)


async def storage_error_handler(_: Request, exc: Exception) -> JSONResponse:
    """Handle ClientError from botocore (S3/MinIO storage errors)."""
    exc = cast(ClientError, exc)
    error_code = exc.response.get("Error", {}).get("Code", "") if exc.response else ""
    # Permission errors -> 403
    if error_code in (
        "AccessDenied",
        "Forbidden",
        "InvalidAccessKeyId",
        "SignatureDoesNotMatch",
    ):
        return _build_error_response(
            "Storage access denied",
            status.HTTP_403_FORBIDDEN,
            exc,
        )
    # Not found errors -> 404
    if error_code in ("NoSuchKey", "NoSuchBucket", "404"):
        return _build_error_response(
            "Storage resource not found",
            status.HTTP_404_NOT_FOUND,
            exc,
        )
    # Rate limiting / service unavailable -> 503
    if error_code in ("SlowDown", "ServiceUnavailable", "503"):
        return _build_error_response(
            "Storage service temporarily unavailable",
            status.HTTP_503_SERVICE_UNAVAILABLE,
            exc,
        )
    # Invalid request -> 400
    if error_code in ("InvalidRequest", "InvalidArgument", "MalformedXML"):
        return _build_error_response(
            "Invalid storage request",
            status.HTTP_400_BAD_REQUEST,
            exc,
        )
    # Default: other storage errors -> 500
    return _build_error_response(
        "Storage operation failed",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        exc,
    )
