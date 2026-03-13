.PHONY: help env sync start dev prestart test test-cov format format-check lint mypy pre-commit-install pre-commit email-templates docker-build docker-prestart docker-run docker-test clean secret-key generate-sbom generate-sbom-local alembic-current alembic-history alembic-upgrade alembic-upgrade-one alembic-downgrade alembic-revision alembic-revision-empty alembic-stamp alembic-heads alembic-check db-start db-stop db-status db-migrate db-reset db-reset-local db-seed db-shell

help:
	@echo "Available targets:"
	@echo "  env              - Create .env file from .env.example"
	@echo "  sync             - Install/update dependencies with uv"
	@echo "  start            - Run pre-start checks and start development server"
	@echo "  dev              - Run development server (assumes DB initialized)"
	@echo "  prestart         - Run pre-start checks and initialization only"
	@echo "  test             - Run tests without coverage"
	@echo "  test-cov         - Run tests with coverage and generate HTML report"
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
	@echo "  clean            - Remove generated files"
	@echo "  secret-key       - Generate a secure secret key"
	@echo "  generate-sbom    - Generate SBOM (requires Docker)"
	@echo "  generate-sbom-local - Generate SBOM locally (no Docker, only on ubuntu)"
	@echo ""
	@echo "Alembic Migration Commands:"
	@echo "  alembic-current  - Show current database revision"
	@echo "  alembic-history  - Show migration history"
	@echo "  alembic-upgrade  - Apply all pending migrations (upgrade to head)"
	@echo "  alembic-upgrade-one - Upgrade one migration"
	@echo "  alembic-downgrade - Downgrade one migration"
	@echo "  alembic-revision - Create new migration (autogenerate, use MSG=\"message\")"
	@echo "  alembic-revision-empty - Create empty migration (use MSG=\"message\")"
	@echo "  alembic-stamp    - Stamp database with current revision (no migration)"
	@echo "  alembic-heads    - Show all head revisions"
	@echo "  alembic-check     - Check if migrations are needed"
	@echo ""
	@echo "Database Commands:"
	@echo "  db-start         - Start database service (Docker Compose)"
	@echo "  db-stop          - Stop database service"
	@echo "  db-status        - Check database connection status"
	@echo "  db-migrate       - Run database migrations"
	@echo "  db-reset         - Reset database (drop schema and recreate)"
	@echo "  db-reset-local   - Reset local database (drop schema and recreate)"
	@echo "  db-seed          - Seed database with initial data"
	@echo "  db-shell         - Open database shell (psql)"

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example"; \
		echo "⚠️  Please edit .env and update values marked with 'changethis'"; \
	else \
		echo ".env already exists, skipping..."; \
	fi

secret-key:
	@uv run python -c "import secrets; print(secrets.token_urlsafe(32))"

sync:
	uv sync

start:
	@echo "Starting application..."
	$(MAKE) prestart
	@echo "Launching development server..."
	uv run fastapi dev app/main.py --port 8000 --host 0.0.0.0

dev:
	uv run fastapi dev app/main.py --port 8000 --host 0.0.0.0

prestart:
	uv run bash scripts/prestart.sh

	@echo "Database reset complete. Run 'make alembic-upgrade' to recreate tables via migrations."

alembic-current:
	uv run alembic current

alembic-history:
	uv run alembic history

alembic-upgrade:
	uv run alembic upgrade head

alembic-upgrade-one:
	uv run alembic upgrade +1

alembic-downgrade:
	uv run alembic downgrade -1

alembic-revision:
	@if [ -z "$(MSG)" ]; then \
		echo "Error: MSG is required. Usage: make alembic-revision MSG=\"your message\""; \
		exit 1; \
	fi
	uv run alembic revision --autogenerate -m "$(MSG)"

alembic-revision-empty:
	@if [ -z "$(MSG)" ]; then \
		echo "Error: MSG is required. Usage: make alembic-revision-empty MSG=\"your message\""; \
		exit 1; \
	fi
	uv run alembic revision -m "$(MSG)"

alembic-stamp:
	uv run alembic stamp head

alembic-heads:
	uv run alembic heads

alembic-check:
	uv run alembic check

db-start:
	@echo "Starting database service..."
	@docker compose up -d db
	@echo "Waiting for database to be ready..."
	@timeout 30 bash -c 'until docker compose exec -T db pg_isready -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-mydb} > /dev/null 2>&1; do sleep 1; done' || true
	@echo "Database is ready"

db-stop:
	@echo "Stopping database service..."
	@docker compose stop db

db-status:
	@echo "Checking database connection..."
	@uv run python -c "from app.db.session import get_engine; from sqlalchemy import text; engine = get_engine(); conn = engine.connect(); conn.execute(text('SELECT 1')); conn.close(); print('✓ Database connection successful')" || echo "✗ Database connection failed"

db-migrate:
	@echo "Running database migrations..."
	@$(MAKE) alembic-upgrade

db-reset:
	@echo "Resetting database..."
	@docker compose exec db sh -c 'psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-mydb} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'

db-reset-local:
	@echo "Resetting local database..."
	@psql "postgresql://postgres:changethis@localhost:5432/fertiscan" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

db-seed:
	@echo "Seeding database with initial data..."
	@uv run python -m app.db.init_db

db-shell:
	@echo "Opening database shell..."
	@docker compose exec db psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-mydb}

test:
	uv run bash scripts/test.sh

test-cov:
	uv run bash scripts/test-cov.sh

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
	bash scripts/build-email-templates.sh

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
		fertiscan-backend:latest bash scripts/test-cov.sh


generate-sbom:
	bash scripts/generate-sbom.sh
	rm -rf .venv && uv sync

generate-sbom-local:
	uv sync --group dev --group sbom
	uv run cyclonedx-py environment --output-reproducible -v --sv 1.6 \
            --pyproject pyproject.toml -o sbom.json && echo "" >> sbom.json
	rm -rf .venv && uv sync


clean:
	rm -rf app/email-templates/build/*.html
	rm -rf htmlcov/ .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
