#!/bin/bash
# Generate SBOM (Software Bill of Materials) for Node.js/npm project.
# Usage: ./scripts/generate-sbom.sh (from frontend/)
#
# Creates a reproducible environment using Docker and generates
# an SBOM in CycloneDX format (sbom.json) from package-lock.json.
# Run when dependencies change in package.json.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building SBOM generator image..."
docker build -t fertiscan-sbom-npm -f "$PROJECT_DIR/Dockerfile.sbom" "$PROJECT_DIR"

echo "Generating SBOM..."
docker run --rm \
  -v "$PROJECT_DIR":/app \
  -u "$(id -u):$(id -g)" \
  fertiscan-sbom-npm

echo "SBOM generated: $PROJECT_DIR/sbom.json"
