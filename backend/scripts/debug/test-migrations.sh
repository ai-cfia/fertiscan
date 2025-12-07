#!/usr/bin/env bash
set -e
set -x

echo "Testing Alembic migration upgrade/downgrade paths..."

echo "Step 1: Resetting database to fresh state"
make db-reset

echo "Step 2: Checking initial state (should be empty)"
uv run alembic current || echo "No migrations applied (expected)"

echo "Step 3: Upgrading to head"
uv run alembic upgrade head

echo "Step 4: Verifying current revision is at head"
CURRENT=$(uv run alembic current | grep -o '[a-f0-9]\{12\}' | head -1)
HEAD=$(uv run alembic heads | grep -o '[a-f0-9]\{12\}' | head -1)
if [ "$CURRENT" != "$HEAD" ]; then
    echo "ERROR: Current revision ($CURRENT) does not match head ($HEAD)"
    exit 1
fi
echo "✓ Current revision matches head: $CURRENT"

echo "Step 5: Verifying database schema"
uv run python -c "
import asyncio
from sqlalchemy import inspect, text
from app.db.session import get_async_engine

async def check_schema():
    async with get_async_engine().connect() as conn:
        result = await conn.execute(text(\"\"\"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        \"\"\"))
        tables = [row[0] for row in result]
        expected_tables = ['alembic_version', 'item', 'user']
        if set(tables) != set(expected_tables):
            print(f'ERROR: Tables mismatch. Expected: {expected_tables}, Got: {tables}')
            exit(1)
        print(f'✓ Schema verified. Tables: {tables}')

asyncio.run(check_schema())
"

echo "Step 6: Downgrading one migration"
uv run alembic downgrade -1

echo "Step 7: Verifying downgrade (should be at base)"
CURRENT_OUTPUT=$(uv run alembic current 2>&1 || true)
CURRENT=$(echo "$CURRENT_OUTPUT" | grep -o '[a-f0-9]\{12\}' | head -1 || echo "")
if [ -n "$CURRENT" ]; then
    echo "ERROR: Expected no migrations after downgrade, but got: $CURRENT"
    exit 1
fi
echo "✓ Successfully downgraded to base (no migrations)"

echo "Step 8: Verifying database is empty (no tables except alembic_version)"
uv run python -c "
import asyncio
from sqlalchemy import text
from app.db.session import get_async_engine

async def check_empty():
    async with get_async_engine().connect() as conn:
        result = await conn.execute(text(\"\"\"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            AND table_name != 'alembic_version'
            ORDER BY table_name
        \"\"\"))
        tables = [row[0] for row in result]
        if tables:
            print(f'ERROR: Expected no tables after downgrade, but found: {tables}')
            exit(1)
        print('✓ Database is empty (only alembic_version table remains)')

asyncio.run(check_empty())
"

echo "Step 9: Upgrading back to head"
uv run alembic upgrade head

echo "Step 10: Final verification"
CURRENT=$(uv run alembic current | grep -o '[a-f0-9]\{12\}' | head -1)
HEAD=$(uv run alembic heads | grep -o '[a-f0-9]\{12\}' | head -1)
if [ "$CURRENT" != "$HEAD" ]; then
    echo "ERROR: Current revision ($CURRENT) does not match head ($HEAD) after round-trip"
    exit 1
fi
echo "✓ Final verification passed. Current revision: $CURRENT"

echo ""
echo "✅ All migration upgrade/downgrade tests passed!"
