#!/usr/bin/env bash
set -e
set -x

if [ "${ENVIRONMENT}" = "testing" ]; then
  uv run python app/tests_pre_start.py
  uv run alembic upgrade head
  uv run python -m app.initial_data
fi

echo "Running tests (parallel execution)..."
uv run pytest tests/ -n auto

echo "Tests complete."
