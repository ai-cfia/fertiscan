.PHONY: help env sync start dev prestart db-reset test test-start test-cov format format-check lint mypy email-templates docker-build docker-prestart docker-run docker-test clean

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
	@echo "  email-templates  - Build email templates from MJML"
	@echo "  docker-build     - Build Docker image"
	@echo "  docker-prestart  - Test Docker prestart script"
	@echo "  docker-run       - Run Docker container with FastAPI"
	@echo "  docker-test      - Run tests inside Docker container"
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

clean:
	rm -rf app/email-templates/build/*.html
	rm -rf htmlcov/ .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

