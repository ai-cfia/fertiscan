#!/usr/bin/env bash
set -e
set -x

if [ "${ENVIRONMENT}" = "testing" ]; then
  uv run python app/tests_pre_start.py
  uv run alembic upgrade head
fi

echo "Running tests with coverage (parallel execution)..."
uv run pytest tests/ --cov=app --cov-report=term --cov-report=html --cov-report= --cov-config=pyproject.toml --cov-fail-under=80

echo "Tests complete. HTML report: htmlcov/index.html"
