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

## Database Session Management

**Important:** Do NOT use `db.commit()` in tests.

The test fixtures handle database isolation automatically:

- Factories use `sqlalchemy_session_persistence = "flush"` which flushes data to
  the session
- The `override_dependencies` fixture makes the API use the same `db` session
- Flushed data is visible within the same session without commit
- The `db` fixture automatically rolls back all changes after each test

**Why not commit?**

- `db.commit()` persists data across tests, breaking test isolation
- `session.rollback()` only rolls back uncommitted changes
- Once committed, rollback cannot undo the changes

**Correct pattern:**

```python
def test_example(client: TestClient, db: Session):
    user = UserFactory()
    LabelFactory.create_batch(3, created_by=user)
    # NO db.commit() needed - factories flush automatically
    response = client.get("/labels", headers=headers)
    # Test assertions...
```

**Incorrect pattern:**

```python
def test_example(client: TestClient, db: Session):
    user = UserFactory()
    LabelFactory.create_batch(3, created_by=user)
    db.commit()  # ❌ DON'T DO THIS - breaks test isolation
    response = client.get("/labels", headers=headers)
```
