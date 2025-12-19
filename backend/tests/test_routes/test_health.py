"""Health check route tests."""

import pytest
from fastapi.testclient import TestClient


def test_healthz(client: TestClient) -> None:
    """Test liveness probe endpoint."""
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.usefixtures("override_dependencies")
def test_readyz(client: TestClient) -> None:
    """Test readiness probe endpoint."""
    response = client.get("/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}
