#!/usr/bin/env bash
set -e
set -x

echo "Running type checks..."
uv run mypy app

echo "Running linter..."
uv run ruff check app tests scripts

echo "Checking code formatting..."
uv run ruff format app tests scripts --check

echo "All checks passed"
