#!/usr/bin/env bash
set -e
set -x

echo "Running type checks..."
mypy app

echo "Running linter..."
ruff check app tests scripts

echo "Checking code formatting..."
ruff format app tests scripts --check

echo "All checks passed"

