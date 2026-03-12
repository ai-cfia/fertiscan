.PHONY: help generate-openapi-client backend-% frontend-% backend-help backend-dev backend-sync backend-test backend-test-cov backend-lint backend-mypy backend-format backend-format-check backend-prestart backend-email-templates backend-alembic-upgrade backend-alembic-check backend-generate-sbom backend-db-start backend-db-stop backend-db-status backend-db-migrate backend-db-reset backend-db-reset-local backend-db-seed backend-db-shell frontend-help frontend-dev frontend-build frontend-lint frontend-preview frontend-test frontend-generate-openapi-client frontend-generate-sbom pre-commit-install pre-commit docker-compose-build docker-up docker-up-d docker-watch docker-down docker-down-v docker-logs docker-ps db-start db-stop db-status db-migrate db-reset db-reset-local db-seed db-shell minio-start minio-stop minio-status minio-reset minio-console build-all build-backend build-frontend test-all lint-all format-all format-check-all docker-build-backend docker-build-frontend docker-build-all prepare-deploy sync-all clean-all env sbom-scan-backend sbom-scan-frontend sbom-scan-all renovate-local

help:
	@echo "Monorepo Makefile (Development & Local Workflows)"
	@echo ""
	@echo "Note: This Makefile is primarily for local development."
	@echo "      Production deployments are handled by CI/CD pipelines."
	@echo ""
	@echo "Development commands:"
	@echo "  env                      - Create .env files for both backend and frontend"
	@echo "  sync-all                 - Install/update dependencies for both backend and frontend"
	@echo "  test-all                 - Run tests for both backend and frontend"
	@echo "  lint-all                 - Run linting for both backend and frontend"
	@echo "  format-all               - Format code for both backend and frontend"
	@echo "  format-check-all         - Check formatting for both backend and frontend"
	@echo "  clean-all                - Clean generated files for both backend and frontend"
	@echo ""
	@echo "Local build commands (for testing production builds locally):"
	@echo "  build-all                - Build both backend and frontend"
	@echo "  build-backend            - Build backend Docker image"
	@echo "  build-frontend           - Build frontend for production"
	@echo "  docker-build-backend     - Build backend Docker image"
	@echo "  docker-build-frontend    - Build frontend Docker image"
	@echo "  docker-build-all         - Build both backend and frontend Docker images"
	@echo "  prepare-deploy           - Prepare for deployment (lint, format-check, test, build)"
	@echo ""
	@echo "Local development (Docker Compose):"
	@echo "  docker-watch             - Start services with file watching (recommended for development)"
	@echo "  docker-compose-build     - Build Docker Compose services (dev only)"
	@echo "  docker-up                - Start all services with Docker Compose"
	@echo "  docker-up-d              - Start all services in background"
	@echo "  docker-down              - Stop all services"
	@echo "  docker-down-v            - Stop all services and remove volumes"
	@echo "  docker-logs              - View backend logs"
	@echo "  docker-ps                - List running services"
	@echo ""
	@echo "Database commands:"
	@echo "  db-start                 - Start database service (Docker Compose)"
	@echo "  db-stop                  - Stop database service"
	@echo "  db-status                - Check database connection status"
	@echo "  db-migrate               - Run database migrations"
	@echo "  db-reset                 - Reset database (drop schema and recreate)"
	@echo "  db-reset-local           - Reset local database (drop schema and recreate)"
	@echo "  db-seed                  - Seed database with initial data"
	@echo "  db-shell                 - Open database shell (psql)"
	@echo ""
	@echo "Storage commands:"
	@echo "  minio-start              - Start MinIO service (Docker Compose)"
	@echo "  minio-stop               - Stop MinIO service"
	@echo "  minio-status             - Check MinIO connection status"
	@echo "  minio-reset              - Reset MinIO (remove volume and restart)"
	@echo "  minio-console            - Open MinIO web console in browser"
	@echo ""
	@echo "Development tools:"
	@echo "  generate-openapi-client  - Generate OpenAPI client from backend spec"
	@echo "  pre-commit-install       - Install pre-commit hooks from root config"
	@echo "  pre-commit               - Run pre-commit checks on all files"
	@echo "  renovate-local  	   	  - Run Renovate locally for testing"
	@echo ""
	@echo "Security scanning (requires grype: brew install grype):"
	@echo "  sbom-scan-backend        - Scan backend SBOM for vulnerabilities"
	@echo "  sbom-scan-frontend       - Scan frontend SBOM for vulnerabilities"
	@echo "  sbom-scan-all            - Scan all SBOMs for vulnerabilities"
	@echo ""
	@echo "Backend commands (delegated to backend/Makefile):"
	@echo "  backend-help             - Show backend-specific help"
	@echo "  backend-dev              - Run backend development server"
	@echo "  backend-test             - Run backend tests"
	@echo "  backend-sync             - Install/update backend dependencies"
	@echo "  (use 'make backend-<target>' for any backend target)"
	@echo ""
	@echo "Frontend commands (delegated to frontend/Makefile):"
	@echo "  frontend-help            - Show frontend-specific help"
	@echo "  frontend-dev             - Run frontend development server"
	@echo "  frontend-build           - Build frontend for production"
	@echo "  frontend-lint            - Lint frontend code"
	@echo "  frontend-preview         - Preview production build"
	@echo "  frontend-test            - Run frontend tests"
	@echo "  frontend-generate-openapi-client - Generate OpenAPI TypeScript client"
	@echo "  (use 'make frontend-<target>' for any frontend target)"

generate-openapi-client:
	@./scripts/generate-openapi-client.sh

backend-%:
	@$(MAKE) -C backend $(patsubst backend-%,%,$@)

backend-help:
	@$(MAKE) -C backend help
backend-dev:
	@$(MAKE) -C backend dev
backend-sync:
	@$(MAKE) -C backend sync
backend-test:
	@$(MAKE) -C backend test
backend-test-cov:
	@$(MAKE) -C backend test-cov
backend-lint:
	@$(MAKE) -C backend lint
backend-mypy:
	@$(MAKE) -C backend mypy
backend-format:
	@$(MAKE) -C backend format
backend-format-check:
	@$(MAKE) -C backend format-check
backend-prestart:
	@$(MAKE) -C backend prestart
backend-email-templates:
	@$(MAKE) -C backend email-templates
backend-alembic-upgrade:
	@$(MAKE) -C backend alembic-upgrade
backend-alembic-check:
	@$(MAKE) -C backend alembic-check
backend-generate-sbom:
	@$(MAKE) -C backend generate-sbom
backend-db-start:
	@$(MAKE) -C backend db-start
backend-db-stop:
	@$(MAKE) -C backend db-stop
backend-db-status:
	@$(MAKE) -C backend db-status
backend-db-migrate:
	@$(MAKE) -C backend db-migrate
backend-db-reset:
	@$(MAKE) -C backend db-reset
backend-db-reset-local:
	@$(MAKE) -C backend db-reset-local
backend-db-seed:
	@$(MAKE) -C backend db-seed
backend-db-shell:
	@$(MAKE) -C backend db-shell

frontend-%:
	@$(MAKE) -C frontend $(patsubst frontend-%,%,$@)

frontend-help:
	@$(MAKE) -C frontend help
frontend-dev:
	@$(MAKE) -C frontend dev
frontend-build:
	@$(MAKE) -C frontend build
frontend-lint:
	@$(MAKE) -C frontend lint
frontend-preview:
	@$(MAKE) -C frontend preview
frontend-test:
	@$(MAKE) -C frontend test
frontend-generate-openapi-client:
	@$(MAKE) -C frontend generate-openapi-client
frontend-generate-sbom:
	@$(MAKE) -C frontend generate-sbom

pre-commit-install:
	@uv run --directory backend pre-commit install
	@echo "Pre-commit hooks installed from root config."

pre-commit:
	@uv run --directory backend pre-commit run --all-files

docker-compose-build:
	@echo "Building Docker Compose services..."
	@docker compose build

docker-up:
	@echo "Starting all services with Docker Compose..."
	@echo "Access the API at http://localhost:8000"
	@echo "Access pgAdmin at http://localhost:5050"
	@echo "Access MinIO console at http://localhost:9001"
	@docker compose up --build

docker-up-d:
	@echo "Starting all services in background..."
	@docker compose up --build -d
	@echo "Services started. Use 'make docker-logs' to view logs."

docker-watch:
	@echo "Starting services with file watching..."
	@echo "Changes to code will automatically trigger rebuilds/restarts"
	@docker compose watch

docker-down:
	@echo "Stopping all services..."
	@docker compose down

docker-down-v:
	@echo "Stopping all services and removing volumes..."
	@docker compose down -v

docker-logs:
	@docker compose logs -f backend

docker-ps:
	@docker compose ps

db-start:
	@$(MAKE) backend-db-start

db-stop:
	@$(MAKE) backend-db-stop

db-status:
	@$(MAKE) backend-db-status

db-migrate:
	@$(MAKE) backend-db-migrate

db-reset:
	@$(MAKE) backend-db-reset

db-reset-local:
	@$(MAKE) backend-db-reset-local

db-seed:
	@$(MAKE) backend-db-seed

db-shell:
	@$(MAKE) backend-db-shell

minio-start:
	@echo "Starting MinIO service..."
	@docker compose up -d minio
	@echo "Waiting for MinIO to be ready..."
	@timeout 30 bash -c 'until docker compose exec -T minio curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do sleep 1; done' || true
	@echo "MinIO is ready"
	@echo "Access MinIO console at http://localhost:9001"

minio-stop:
	@echo "Stopping MinIO service..."
	@docker compose stop minio

minio-status:
	@echo "Checking MinIO connection..."
	@docker compose exec -T minio curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1 && echo "✓ MinIO connection successful" || echo "✗ MinIO connection failed"

minio-reset:
	@echo "Resetting MinIO..."
	@docker compose stop minio
	@docker compose rm -f minio
	@docker volume rm fertiscan_minio-data 2>/dev/null || true
	@docker compose up -d minio
	@echo "Waiting for MinIO to be ready..."
	@timeout 30 bash -c 'until docker compose exec -T minio curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do sleep 1; done' || true
	@echo "MinIO reset complete"

minio-console:
	@echo "Opening MinIO console in browser..."
	@echo "Console URL: http://localhost:9001"
	@echo "Login with credentials from backend/.env (STORAGE_ACCESS_KEY / STORAGE_SECRET_KEY)"
	@command -v open > /dev/null && open http://localhost:9001 || command -v xdg-open > /dev/null && xdg-open http://localhost:9001 || echo "Please open http://localhost:9001 in your browser"

build-all: build-backend build-frontend

build-backend:
	@echo "Building backend Docker image..."
	@$(MAKE) -C backend docker-build

build-frontend:
	@echo "Building frontend for production..."
	@$(MAKE) -C frontend build

test-all:
	@echo "Running backend tests..."
	@$(MAKE) -C backend test || true
	@echo "Running frontend tests..."
	@$(MAKE) -C frontend test || true

lint-all:
	@echo "Linting backend..."
	@$(MAKE) -C backend lint || true
	@echo "Linting frontend..."
	@$(MAKE) -C frontend lint || true

format-all:
	@echo "Formatting backend..."
	@$(MAKE) -C backend format || true
	@echo "Formatting frontend..."
	@npm run --prefix frontend lint || true

format-check-all:
	@echo "Checking backend formatting..."
	@$(MAKE) -C backend format-check || true
	@echo "Checking frontend formatting..."
	@cd frontend && npx biome check --no-errors-on-unmatched --files-ignore-unknown=true ./ || true

env:
	@echo "Creating backend .env file..."
	@$(MAKE) -C backend env
	@echo "Creating frontend .env file..."
	@if [ ! -f frontend/.env ]; then \
		cp frontend/.env.example frontend/.env; \
		echo "Created frontend/.env from frontend/.env.example"; \
		echo "⚠️  Please edit frontend/.env and update values as needed"; \
	else \
		echo "frontend/.env already exists, skipping..."; \
	fi

sync-all:
	@echo "Syncing backend dependencies..."
	@$(MAKE) -C backend sync
	@echo "Syncing frontend dependencies..."
	@cd frontend && npm install

clean-all:
	@echo "Cleaning backend..."
	@$(MAKE) -C backend clean || true
	@echo "Cleaning frontend..."
	@cd frontend && npm run clean || echo "Frontend clean not configured"

docker-build-backend:
	@echo "Building backend Docker image..."
	@$(MAKE) -C backend docker-build

docker-build-frontend:
	@echo "Building frontend Docker image..."
	@docker build -t fertiscan-frontend:latest -f frontend/Dockerfile frontend/

docker-build-all: docker-build-backend docker-build-frontend

prepare-deploy: lint-all format-check-all test-all build-all
	@echo "Deployment preparation complete!"

sbom-scan-backend:
	@echo "Scanning backend SBOM for vulnerabilities..."
	@grype sbom:backend/sbom.json

sbom-scan-frontend:
	@echo "Scanning frontend SBOM for vulnerabilities..."
	@grype sbom:frontend/sbom.json

sbom-scan-all: sbom-scan-backend sbom-scan-frontend
	@echo "SBOM scanning complete."

renovate-local:
	@echo "Running Renovate locally for testing..."
	@test -n "$$GITHUB_COM_TOKEN" || (echo 'Error: GITHUB_COM_TOKEN is undefined. Please export it using: export GITHUB_COM_TOKEN="{your_token_here}"' && exit 1)
		@mkdir -p experiments
		@> experiments/log.txt
		@{ \
        spin='-\|/'; i=0; \
        ( LOG_LEVEL=debug sh -c 'yes y | npx renovate --platform=local' >> experiments/log.txt 2>&1 ) & \
        pid=$$!; \
        printf "Working "; \
        while kill -0 $$pid 2>/dev/null; do \
            i=$$(( (i+1) % 4 )); \
            printf "\rWorking %s" "$${spin:$$i:1}"; \
            sleep 0.1; \
        done; \
        wait $$pid; rc=$$?; \
        printf "\r"; \
        exit $$rc; \
    }
		@echo "Logs written to experiments/log.txt"
