.PHONY: help dev build lint preview test generate-openapi-client generate-sbom i18n-status i18n-sync i18n-lint i18n-validate

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
	@echo "  i18n-status            - Show translation status"
	@echo "  i18n-sync              - Sync translation files with primary language"
	@echo "  i18n-lint              - Lint for hardcoded strings"
	@echo "  i18n-validate         - Validate translations (check for missing)"

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

i18n-status:
	@npm run i18n:status

i18n-sync:
	@npm run i18n:sync

i18n-lint:
	@npm run i18n:lint

i18n-validate:
	@npm run i18n:validate
