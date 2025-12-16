# Development Guide

Guide for setting up your development environment and working with FertiScan.

## Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) package manager
- Node.js 20+
- npm
- Docker and Docker Compose (for local development with database)
- PostgreSQL 18+ (if running database locally without Docker)

## Project Structure

```text
fertiscan-backend/
├── backend/          # FastAPI backend API
├── frontend/         # Frontend application
├── scripts/          # Shared CI/CD automation scripts
└── docker-compose.yml # Local development services
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ai-cfia/fertiscan-backend.git
cd fertiscan-backend
```

### 2. Install Dependencies

```bash
cd backend && uv sync
cd ../frontend && npm install
```

```bash
# Or using make
make sync-all
```

### 3. Set Up Environment

```bash
# Backend: Create .env file manually
cd backend
cp .env.example .env
# Edit backend/.env with your configuration

# Frontend: Create .env file
cd ../frontend
cp .env.example .env
# Edit frontend/.env with your configuration
```

```bash
# Or using make (creates .env files for both backend and frontend)
make env
# Edit backend/.env and frontend/.env with your configuration
```

### 4. Start Development Services

```bash
docker compose watch
```

```bash
# Or using make
make docker-watch
```

See [Development Workflows](#development-workflows) for running services
separately or other options.

## Development Workflows

Run backend and frontend separately when you need more control, want to
debug specific services, or prefer running them outside Docker.

### Running Backend

```bash
# From root
cd backend && uv run fastapi dev app/main.py --port 5000

# Or from backend directory
cd backend
uv run fastapi dev app/main.py --port 5000
```

```bash
# Or using make
# From root
make backend-dev

# Or from backend directory
cd backend
make dev
```

Backend API available at:

- API: <http://localhost:5000>
- Interactive docs: <http://localhost:5000/docs>
- ReDoc: <http://localhost:5000/redoc>

### Running Frontend

```bash
# From root
cd frontend && npm run dev

# Or from frontend directory
cd frontend
npm run dev
```

```bash
# Or using make
# From root
make frontend-dev
```

Frontend available at: <http://localhost:5173>

## Testing

### Backend Tests

```bash
# Run all backend tests
cd backend && uv run pytest tests/

# Run with coverage
cd backend && uv run bash scripts/test-cov.sh
```

```bash
# Or using make
# Run all backend tests
make backend-test

# Run with coverage
cd backend && make test-cov
```

### Frontend Tests

```bash
cd frontend && npm run test
```

```bash
# Or using make
make frontend-test
```

### Run All Tests

```bash
cd backend && uv run pytest tests/
cd ../frontend && npm run test
```

```bash
# Or using make
make test-all
```

## Code Quality

### Linting

```bash
# Lint both backend and frontend
cd backend && uv run bash scripts/lint.sh
cd ../frontend && npm run lint

# Or individually:
cd backend && uv run bash scripts/lint.sh
cd frontend && npm run lint
```

```bash
# Or using make
# Lint both backend and frontend
make lint-all

# Or individually:
make backend-lint
make frontend-lint
```

### Formatting

```bash
# Format both backend and frontend
cd backend && uv run bash scripts/format.sh
cd ../frontend && npm run lint

# Check formatting without changes
cd backend && uv run ruff format app tests scripts --check
cd ../frontend && npx biome check --no-errors-on-unmatched --files-ignore-unknown=true ./
```

```bash
# Or using make
# Format both backend and frontend
make format-all

# Check formatting without changes
make format-check-all
```

## Additional Resources

- [Testing Guide](./TESTING.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

Run `make help` for all available commands.
