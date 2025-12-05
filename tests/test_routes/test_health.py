"""Health check route tests."""

from fastapi.testclient import TestClient


def test_healthz(client: TestClient) -> None:
    """Test liveness probe endpoint."""
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "ok"}


def test_readyz(client: TestClient) -> None:
    """Test readiness probe endpoint."""
    response = client.get("/readyz")
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "ok", "database": "connected"}
