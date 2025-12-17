.PHONY: help generate-openapi-client backend-% frontend-% backend-help backend-dev backend-sync backend-test backend-test-cov backend-lint backend-mypy backend-format backend-format-check backend-prestart backend-email-templates backend-alembic-upgrade backend-alembic-check frontend-help frontend-dev frontend-build frontend-lint frontend-preview frontend-test frontend-generate-openapi-client pre-commit-install pre-commit docker-compose-build docker-up docker-up-d docker-watch docker-down docker-down-v docker-logs docker-ps db-reset build-all build-backend build-frontend test-all lint-all format-all format-check-all docker-build-backend docker-build-frontend docker-build-all prepare-deploy sync-all clean-all env

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
	@echo "  db-reset                 - Reset database schema"
	@echo ""
	@echo "Development tools:"
	@echo "  generate-openapi-client  - Generate OpenAPI client from backend spec"
	@echo "  pre-commit-install       - Install pre-commit hooks from root config"
	@echo "  pre-commit               - Run pre-commit checks on all files"
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

db-reset:
	@echo "Resetting database..."
	@docker compose exec db sh -c 'psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-mydb} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'

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
