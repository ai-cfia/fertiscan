.PHONY: help env start dev prestart db-reset test test-start test-cov format format-check lint mypy email-templates clean

help:
	@echo "Available targets:"
	@echo "  env              - Create .env file from .env.example"
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
	@echo "  clean            - Remove generated files"

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example"; \
		echo "⚠️  Please edit .env and update values marked with 'changethis'"; \
	else \
		echo ".env already exists, skipping..."; \
	fi

start:
	@echo "Starting application..."
	$(MAKE) prestart
	@echo "Launching development server..."
	fastapi dev app/main.py --port 5000

dev:
	fastapi dev app/main.py --port 5000

prestart:
	@echo "Running pre-start checks..."
	python -m app.backend_pre_start
	@echo "Creating/updating database tables..."
	python -m app.initial_data
	@echo "Pre-start complete"

db-reset:
	@echo "Resetting database..."
	docker exec postgres psql -U k-allagbe -d mydb -c "DROP TABLE IF EXISTS item CASCADE; DROP TABLE IF EXISTS \"user\" CASCADE;"
	@echo "Database reset complete. Run 'make prestart' to recreate tables."

test:
	coverage run -m pytest tests/
	coverage report

test-start:
	python -m app.tests_pre_start
	$(MAKE) test

test-cov: test
	coverage html
	@echo "Coverage report generated in htmlcov/index.html"

format:
	ruff check app tests --fix
	ruff format app tests

format-check:
	ruff format app tests --check

lint:
	ruff check app tests

mypy:
	mypy app

email-templates:
	@mkdir -p app/email-templates/build
	@for file in app/email-templates/src/*.mjml; do \
		mjml $$file -o app/email-templates/build/$$(basename $$file .mjml).html; \
	done
	@echo "Email templates built"

clean:
	rm -rf app/email-templates/build/*.html
	rm -rf htmlcov/ .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

