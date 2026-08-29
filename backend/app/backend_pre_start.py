import json
import logging
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import boto3
from sqlalchemy import text
from tenacity import (
    after_log,
    before_log,
    before_sleep_log,
    retry,
    stop_after_attempt,
    wait_fixed,
)

from app.config import settings
from app.db.session import get_engine

logger = logging.getLogger(__name__)
MAX_TRIES = 60
WAIT_SECONDS = 1


@retry(
    stop=stop_after_attempt(MAX_TRIES),
    wait=wait_fixed(WAIT_SECONDS),
    reraise=True,
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
    before_sleep=before_sleep_log(logger, logging.ERROR),
)
def check_db() -> None:
    """Check database connectivity."""
    with get_engine().connect() as conn:
        conn.execute(text("SELECT 1"))


@retry(
    stop=stop_after_attempt(MAX_TRIES),
    wait=wait_fixed(WAIT_SECONDS),
    reraise=True,
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
    before_sleep=before_sleep_log(logger, logging.ERROR),
)
def check_storage() -> None:
    """Check storage connectivity."""
    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint_url,
        aws_access_key_id=settings.MINIO_ROOT_USER,
        aws_secret_access_key=settings.MINIO_ROOT_PASSWORD.get_secret_value(),
        region_name=settings.STORAGE_REGION,
    )
    s3_client.list_buckets()


def check_llm() -> None:
    """Check Azure OpenAI reachability without making a completion request."""
    endpoint = (settings.AZURE_OPENAI_ENDPOINT or "").rstrip("/")
    api_key = settings.AZURE_OPENAI_API_KEY
    api_version = settings.AZURE_OPENAI_API_VERSION
    deployment_name = settings.AZURE_OPENAI_MODEL

    if not endpoint or api_key is None or not deployment_name:
        raise RuntimeError(
            "Azure OpenAI is not configured: AZURE_OPENAI_ENDPOINT, "
            "AZURE_OPENAI_API_KEY, and AZURE_OPENAI_MODEL are required"
        )

    query = urlencode({"api-version": api_version})
    request = Request(
        f"{endpoint}/openai/deployments?{query}",
        headers={"api-key": api_key.get_secret_value()},
        method="GET",
    )
    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace").strip()
        detail = f": {body}" if body else ""
        raise RuntimeError(
            f"Azure OpenAI reachability check failed: HTTP {exc.code} {exc.reason}{detail}"
        ) from exc
    except OSError as exc:
        raise RuntimeError(f"Azure OpenAI reachability check failed: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Azure OpenAI reachability check failed: deployments response was not valid JSON"
        ) from exc

    deployments = payload.get("data")
    if not isinstance(deployments, list):
        raise RuntimeError(
            "Azure OpenAI reachability check failed: deployments response did not contain a data list"
        )

    if not any(
        isinstance(deployment, dict)
        and deployment_name in (deployment.get("id"), deployment.get("model"))
        for deployment in deployments
    ):
        raise RuntimeError(
            f"Azure OpenAI reachability check failed: deployment '{deployment_name}' was not found"
        )


def main() -> None:
    logger.info("Checking service connectivity")
    check_db()
    check_storage()
    check_llm()
    logger.info("Service connectivity checks complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
