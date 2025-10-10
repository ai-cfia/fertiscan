#!/bin/sh -e
set -x

echo "Fixing linting issues..."
ruff check app tests scripts --fix

echo "Formatting code..."
ruff format app tests scripts

echo "Code formatting complete"

