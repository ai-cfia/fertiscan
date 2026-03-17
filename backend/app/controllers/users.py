"""User CRUD operations.

Note: Currently uses password hashing for local auth.
Supports external_id field for future external auth provider migration.
"""

from datetime import datetime
from typing import Any

from pydantic import validate_call
from sqlmodel import Session, or_, select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.security import get_password_hash
from app.db.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def _apply_user_sorting(
    stmt: SelectOfScalar[User],
    order_by: str,
    order: str,
) -> SelectOfScalar[User]:
    """Apply sorting to users query."""
    valid_sort_fields: dict[str, Any] = {
        "id": User.id,
        "email": User.email,
        "first_name": User.first_name,
        "last_name": User.last_name,
        "is_active": User.is_active,
        "is_superuser": User.is_superuser,
        "created_at": User.created_at,
        "createdAt": User.created_at,
    }
    sort_column: Any = valid_sort_fields.get(order_by, User.created_at)
    if order.lower() == "asc":
        stmt = stmt.order_by(sort_column.asc())
    else:
        stmt = stmt.order_by(sort_column.desc())
    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def get_users_query(
    is_active: bool | None = None,
    is_superuser: bool | None = None,
    search: str | None = None,
    start_created_at: datetime | None = None,
    end_created_at: datetime | None = None,
    order_by: str = "created_at",
    order: str = "desc",
) -> SelectOfScalar[User]:
    """Build users query with optional filters and sorting."""
    stmt = select(User)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
    if is_superuser is not None:
        stmt = stmt.where(User.is_superuser == is_superuser)
    if search:
        for term in search.strip().split():
            pattern = f"%{term}%"
            stmt = stmt.where(
                or_(
                    User.email.ilike(pattern),  # type: ignore[attr-defined]
                    User.first_name.ilike(pattern),  # type: ignore[union-attr]
                    User.last_name.ilike(pattern),  # type: ignore[union-attr]
                )
            )
    if start_created_at is not None:
        stmt = stmt.where(User.created_at >= start_created_at)  # type: ignore[operator]
    if end_created_at is not None:
        stmt = stmt.where(User.created_at <= end_created_at)  # type: ignore[operator]
    stmt = _apply_user_sorting(stmt, order_by, order)
    return stmt


@validate_call(config={"arbitrary_types_allowed": True})
def create_user(
    session: Session,
    user_create: UserCreate,
) -> User:
    """Create new user with hashed password."""
    hashed_pwd_field = {"hashed_password": get_password_hash(user_create.password)}
    user = User.model_validate(user_create, update=hashed_pwd_field)
    session.add(user)
    session.flush()
    session.refresh(user)
    return user


@validate_call(config={"arbitrary_types_allowed": True})
def update_user(
    session: Session,
    user: User,
    user_update: UserUpdate,
) -> User:
    """Update a user."""
    update_data = user_update.model_dump(exclude_unset=True)
    if user_update.password:
        hashed_password = get_password_hash(user_update.password)
        update_data["hashed_password"] = hashed_password
    user.sqlmodel_update(update_data)
    session.add(user)
    session.flush()
    session.refresh(user)
    return user


@validate_call(config={"arbitrary_types_allowed": True})
def delete_user(
    session: Session,
    user: User,
) -> None:
    """Delete a user."""
    session.delete(user)
    session.flush()
