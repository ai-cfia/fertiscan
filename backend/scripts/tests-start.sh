#!/usr/bin/env bash
set -e
set -x

uv run pytest tests/ "$@"
