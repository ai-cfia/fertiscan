#!/usr/bin/env bash
set -e
set -x

echo "Running tests with coverage..."
coverage run -m pytest tests/

echo "Generating coverage report..."
coverage report
coverage html --title "${@-coverage}"

echo "Tests complete. HTML report: htmlcov/index.html"

