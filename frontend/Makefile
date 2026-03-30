.PHONY: help dev build lint preview test generate-openapi-client generate-sbom generate-sbom-local

help:
	@echo "Frontend-start Makefile (TanStack Start)"
	@echo ""
	@echo "Available targets:"
	@echo "  dev                    - Run development server"
	@echo "  build                  - Build for production"
	@echo "  lint                   - Lint code with Biome"
	@echo "  preview                - Preview production build"
	@echo "  test                   - Run tests (if configured)"
	@echo "  generate-openapi-client - Generate OpenAPI TypeScript client"
	@echo "  generate-sbom           - Generate SBOM via Docker (CycloneDX)"
	@echo "  generate-sbom-local    - Generate SBOM locally (no Docker, only on ubuntu)"

dev:
	@npm run dev

build:
	@npm run build

lint:
	@npm run lint

preview:
	@npm run preview

test:
	@npm run test || echo "No test script configured"

generate-openapi-client:
	@npm run generate-openapi-client

generate-sbom:
	@bash scripts/generate-sbom.sh

generate-sbom-local:
	@npm ci
	@npx @cyclonedx/cyclonedx-npm package-lock.json --output-reproducible --package-lock-only -v --sv 1.6 -o sbom.json
	@echo "" >> sbom.json
