#!/bin/sh
set -e
set -x

echo "Running pre-start checks..."
uv run python -m app.backend_pre_start

echo "Applying migrations..."
uv run alembic upgrade head

echo "Creating/updating database tables..."
uv run python -m app.db.init_db

echo "Initializing storage..."
uv run python -m app.storage.init

echo "Pre-start complete"
