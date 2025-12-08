#!/usr/bin/env bash

set -e
set -x

cd backend
uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../frontend/openapi.json
cd ../frontend
npm run generate-openapi-client
