.PHONY: help dev build lint preview test generate-openapi-client generate-sbom

help:
	@echo "Frontend Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  dev                    - Run development server"
	@echo "  build                  - Build for production"
	@echo "  lint                   - Lint code with Biome"
	@echo "  preview                - Preview production build"
	@echo "  test                   - Run tests (if configured)"
	@echo "  generate-openapi-client - Generate OpenAPI TypeScript client"
	@echo "  generate-sbom          - Generate SBOM (requires Docker)"

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
	bash scripts/generate-sbom.sh
