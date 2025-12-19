# FertiScan Backend

Backend API for FertiScan built with FastAPI and SQLAlchemy ORM.

## Technology Stack

- ⚡ [FastAPI](https://fastapi.tiangolo.com) - Python web framework
- 💾 [PostgreSQL](https://www.postgresql.org) - Database (async with psycopg)
- 🧰 [SQLAlchemy](https://www.sqlalchemy.org) - ORM (async)
- 🔍 [Pydantic](https://docs.pydantic.dev) - Data validation and settings
- 📦 [uv](https://github.com/astral-sh/uv) - Python package manager
- ✅ [pytest](https://pytest.org) - Testing framework

## Requirements

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) package manager

> **Note**: `make` commands are available as shortcuts (see Available Commands
> below). If `make` is not installed, use the underlying commands shown in
> Quick Start.

## Quick Start

### 1. Install Dependencies

```bash
# Using make (if available)
make sync

# Or directly
uv sync
```

### 2. Configure Environment

Create a `.env` file (or use `make env` to create from `.env.example`):

```bash
# Using make (if available)
make env

# Or manually create .env with the following required variables:
```

```bash
# Database
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=changethis
POSTGRES_DB=mydb

# Security
SECRET_KEY=changethis
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis

# Application
ENVIRONMENT=local
FRONTEND_HOST=http://localhost:5173
BACKEND_CORS_ORIGINS=http://localhost:5173

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=
```

**Important**: Generate secure values for `SECRET_KEY` and `POSTGRES_PASSWORD`:

```bash
# Using make (if available)
make secret-key

# Or directly
uv run python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Initialize and Run

```bash
# Using make (if available)
make start

# Or directly
uv run bash scripts/prestart.sh
uv run fastapi dev app/main.py --port 5000
```

This runs pre-start checks (database health, table creation, initial data) and
starts the development server at <http://localhost:5000>.

## Development

### Running Locally

```bash
# Run development server (assumes DB is running)
make dev
# Or: uv run fastapi dev app/main.py --port 5000

# Or run with pre-start checks
make start
# Or: uv run bash scripts/prestart.sh && uv run fastapi dev app/main.py --port 5000
```

### Available Commands

Run `make help` to see all available commands.

## API Documentation

Once the server is running:

- **Interactive API docs**: <http://localhost:5000/docs>
- **ReDoc**: <http://localhost:5000/redoc>
- **Health check**: <http://localhost:5000/healthz>
- **Readiness check**: <http://localhost:5000/readyz>

## Project Structure

```text
app/
├── config.py          # Application settings
├── main.py            # FastAPI application entry point
├── controllers/       # Request handlers
├── routes/            # API route definitions
├── schemas/           # Pydantic models for validation
├── db/
│   ├── base.py        # SQLAlchemy Base and MetaData
│   ├── session.py     # Database session management
│   └── models/        # SQLAlchemy ORM models
├── core/              # Core utilities (security, etc.)
└── email-templates/   # MJML email templates
```

## Testing

```bash
# Run tests without coverage (faster)
make test
# Or: uv run pytest tests/

# Run tests with coverage report
make test-cov
# Or: uv run bash scripts/test-cov.sh
```

Tests use SQLite in-memory database via dependency overrides - no external
database required.
