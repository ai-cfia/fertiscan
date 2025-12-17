#!/usr/bin/env bash
set -e
set -x

source "$(dirname "$0")/test-db-setup.sh"

echo "Running tests with coverage (parallel execution)..."
uv run pytest tests/ --cov=app --cov-report=term --cov-report=html --cov-report= --cov-config=pyproject.toml --cov-fail-under=80

echo "Tests complete. HTML report: htmlcov/index.html"
