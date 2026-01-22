#!/bin/sh -e
set -x

echo "Fixing linting issues..."
uv run ruff check app tests scripts --fix

echo "Formatting code..."
uv run ruff format app tests scripts

echo "Code formatting complete"
