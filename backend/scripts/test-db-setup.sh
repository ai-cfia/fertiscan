#!/usr/bin/env bash
set -e

if [ "${ENVIRONMENT}" = "testing" ]; then
  uv run python app/tests_pre_start.py
  uv run alembic upgrade head
  uv run alembic check
  uv run python -m app.db.init_db
fi
