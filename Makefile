.PHONY: help generate-openapi-client backend-% frontend-% pre-commit-install pre-commit docker-compose-build docker-up docker-up-d docker-down docker-down-v docker-logs docker-ps db-reset

help:
	@echo "Monorepo Makefile"
	@echo ""
	@echo "Monorepo commands:"
	@echo "  generate-openapi-client  - Generate OpenAPI client from backend spec"
	@echo "  pre-commit-install       - Install pre-commit hooks from root config"
	@echo "  pre-commit               - Run pre-commit checks on all files"
	@echo "  docker-compose-build     - Build Docker Compose services"
	@echo "  docker-up                - Start all services with Docker Compose"
	@echo "  docker-up-d              - Start all services in background"
	@echo "  docker-down              - Stop all services"
	@echo "  docker-down-v            - Stop all services and remove volumes"
	@echo "  docker-logs              - View backend logs"
	@echo "  docker-ps                - List running services"
	@echo "  db-reset                 - Reset database schema"
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
	@echo "  (use 'make frontend-<target>' for any frontend target)"

generate-openapi-client:
	@./scripts/generate-openapi-client.sh

backend-%:
	@$(MAKE) -C backend $(patsubst backend-%,%,$@)

frontend-%:
	@$(MAKE) -C frontend $(patsubst frontend-%,%,$@)

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
