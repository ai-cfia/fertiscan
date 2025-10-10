#!/usr/bin/env bash
set -e
set -x

echo "Running pre-start checks..."
python -m app.backend_pre_start

echo "Creating/updating database tables..."
python -m app.initial_data

echo "Pre-start complete"

