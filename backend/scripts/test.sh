#!/usr/bin/env bash
set -e
set -x

source "$(dirname "$0")/test-db-setup.sh"

echo "Running tests (parallel execution)..."
uv run pytest tests/ -n auto

echo "Tests complete."
