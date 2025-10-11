.PHONY: help env sync start dev prestart db-reset test test-start test-cov format format-check lint mypy pre-commit-install pre-commit email-templates docker-build docker-prestart docker-run docker-test docker-compose-build docker-up docker-up-d docker-down docker-down-v docker-logs docker-ps clean

help:
	@echo "Available targets:"
	@echo "  env              - Create .env file from .env.example"
	@echo "  sync             - Install/update dependencies with uv"
	@echo "  start            - Run pre-start checks and start development server"
	@echo "  dev              - Run development server (assumes DB initialized)"
	@echo "  prestart         - Run pre-start checks and initialization only"
	@echo "  db-reset         - Drop all database tables"
	@echo "  test             - Run tests with coverage"
	@echo "  test-start       - Initialize test DB and run tests with coverage"
	@echo "  test-cov         - Run tests and open coverage report"
	@echo "  format           - Format code with ruff (with --fix)"
	@echo "  format-check     - Check code formatting without changes"
	@echo "  lint             - Run ruff linter"
	@echo "  mypy             - Run type checker"
	@echo "  pre-commit-install - Install pre-commit Git hooks"
	@echo "  pre-commit       - Run pre-commit checks on all files"
	@echo "  email-templates  - Build email templates from MJML"
	@echo "  docker-build     - Build Docker image"
	@echo "  docker-prestart  - Test Docker prestart script"
	@echo "  docker-run       - Run Docker container with FastAPI"
	@echo "  docker-test      - Run tests inside Docker container"
	@echo "  docker-compose-build - Build Docker Compose services"
	@echo "  docker-up        - Start all services with Docker Compose"
	@echo "  docker-up-d      - Start all services detached (background)"
	@echo "  docker-down      - Stop all services"
	@echo "  docker-down-v    - Stop all services and remove volumes"
	@echo "  docker-logs      - Follow backend logs"
	@echo "  docker-ps        - Show service status"
	@echo "  clean            - Remove generated files"

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example"; \
		echo "⚠️  Please edit .env and update values marked with 'changethis'"; \
	else \
		echo ".env already exists, skipping..."; \
	fi

sync:
	uv sync

start:
	@echo "Starting application..."
	$(MAKE) prestart
	@echo "Launching development server..."
	uv run fastapi dev app/main.py --port 5000

dev:
	uv run fastapi dev app/main.py --port 5000

prestart:
	uv run bash scripts/prestart.sh

db-reset:
	@echo "Resetting database..."
	docker exec postgres psql -U k-allagbe -d mydb -c "DROP TABLE IF EXISTS item CASCADE; DROP TABLE IF EXISTS \"user\" CASCADE;"
	@echo "Database reset complete. Run 'make prestart' to recreate tables."

test:
	uv run bash scripts/test.sh

test-start:
	uv run bash scripts/tests-start.sh

test-cov: test
	uv run coverage html
	@echo "Coverage report generated in htmlcov/index.html"

format:
	uv run bash scripts/format.sh

format-check:
	uv run ruff format app tests scripts --check

lint:
	uv run bash scripts/lint.sh

mypy:
	uv run mypy app

pre-commit-install:
	uv run pre-commit install
	@echo "Pre-commit hooks installed. They will run automatically on git commit."

pre-commit:
	uv run pre-commit run --all-files

email-templates:
	@mkdir -p app/email-templates/build
	@for file in app/email-templates/src/*.mjml; do \
		mjml $$file -o app/email-templates/build/$$(basename $$file .mjml).html; \
	done
	@echo "Email templates built"

docker-build:
	@echo "Building Docker image..."
	docker build -t fertiscan-backend:latest .
	@echo "Docker image built successfully"

docker-prestart:
	@echo "Testing Docker prestart script..."
	docker run --rm --env-file .env \
		-e POSTGRES_SERVER=host.docker.internal \
		fertiscan-backend:latest bash scripts/prestart.sh

docker-run:
	@echo "Running Docker container..."
	@echo "Access the API at http://localhost:8000"
	docker run --rm --env-file .env -p 8000:8000 \
		-e POSTGRES_SERVER=host.docker.internal \
		fertiscan-backend:latest

docker-test:
	@echo "Running tests in Docker container..."
	docker run --rm --env-file .env \
		-e POSTGRES_SERVER=host.docker.internal \
		fertiscan-backend:latest bash scripts/tests-start.sh

docker-compose-build:
	@echo "Building Docker Compose services..."
	DOCKER_IMAGE_BACKEND=fertiscan-backend TAG=dev docker compose build

docker-up:
	@echo "Starting all services with Docker Compose..."
	@echo "Access the API at http://localhost:8000"
	@echo "Access pgAdmin at http://localhost:5050"
	DOCKER_IMAGE_BACKEND=fertiscan-backend TAG=dev docker compose up --build

docker-up-d:
	@echo "Starting all services in background..."
	DOCKER_IMAGE_BACKEND=fertiscan-backend TAG=dev docker compose up --build -d
	@echo "Services started. Use 'make docker-logs' to view logs."

docker-down:
	@echo "Stopping all services..."
	DOCKER_IMAGE_BACKEND=fertiscan-backend TAG=dev docker compose down

docker-down-v:
	@echo "Stopping all services and removing volumes..."
	DOCKER_IMAGE_BACKEND=fertiscan-backend TAG=dev docker compose down -v

docker-logs:
	DOCKER_IMAGE_BACKEND=fertiscan-backend TAG=dev docker compose logs -f backend

docker-ps:
	DOCKER_IMAGE_BACKEND=fertiscan-backend TAG=dev docker compose ps

clean:
	rm -rf app/email-templates/build/*.html
	rm -rf htmlcov/ .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
