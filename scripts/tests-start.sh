#!/usr/bin/env bash
set -e
set -x

echo "Initializing test database..."
python -m app.tests_pre_start

bash scripts/test.sh "$@"

