#!/bin/bash
# Generate SBOM (Software Bill of Materials) for Python/uv project.
# Usage: ./scripts/generate-sbom.sh (from backend/)
#
# Creates a reproducible environment using Docker and generates
# an SBOM in CycloneDX format (sbom.json). Run when dependencies
# change in pyproject.toml.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building SBOM generator image..."
docker build -t fertiscan-sbom-python -f "$PROJECT_DIR/Dockerfile.sbom" "$PROJECT_DIR"

echo "Generating SBOM..."
docker run --rm \
  -v "$PROJECT_DIR":/app \
  -u "$(id -u):$(id -g)" \
  fertiscan-sbom-python

echo "SBOM generated: $PROJECT_DIR/sbom.json"
