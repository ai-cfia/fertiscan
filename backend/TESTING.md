# Testing

Run tests with:

```bash
make test
# Or: uv run pytest tests/
```

Run tests with coverage:

```bash
make test-cov
# Or: uv run bash scripts/test-cov.sh
```

Tests use SQLite in-memory database - no external database required.
