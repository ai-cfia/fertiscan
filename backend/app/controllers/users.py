"""User CRUD operations.

Note: Currently uses password hashing for local auth.
Supports external_id field for future external auth provider migration.
"""

from uuid import UUID

from pydantic import EmailStr, SecretStr, validate_call
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, select

from app.core.security import get_password_hash, verify_password
from app.db.models.user import User
from app.schemas.user import UserCreate, UserUpdate


@validate_call(config={"arbitrary_types_allowed": True})
async def get_users(
    session: AsyncSession, skip: int = 0, limit: int = 100
) -> tuple[list[User], int]:
    """Get all users with pagination."""
    count_stmt = select(func.count()).select_from(User)
    count_result = await session.execute(count_stmt)
    count = count_result.scalar_one()
    stmt = select(User).offset(skip).limit(limit)
    result = await session.execute(stmt)
    users = list(result.scalars().all())
    return users, count


@validate_call(config={"arbitrary_types_allowed": True})
async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    """Get user by ID."""
    return await session.get(User, user_id)


@validate_call(config={"arbitrary_types_allowed": True})
async def get_user_by_email(session: AsyncSession, email: EmailStr) -> User | None:
    """Get user by email."""
    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


@validate_call(config={"arbitrary_types_allowed": True})
async def create_user(session: AsyncSession, user_in: UserCreate) -> User:
    """Create new user with hashed password."""
    hashed_pwd_field = {"hashed_password": get_password_hash(user_in.password)}
    user = User.model_validate(user_in, update=hashed_pwd_field)
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


@validate_call(config={"arbitrary_types_allowed": True})
async def update_user(
    session: AsyncSession, user_id: UUID, user_in: UserUpdate
) -> User | None:
    """Update a user."""
    if not (user := await session.get(User, user_id)):
        return None
    update_data = user_in.model_dump(exclude_unset=True)
    if user_in.password:
        hashed_password = get_password_hash(user_in.password)
        update_data["hashed_password"] = hashed_password
    user.sqlmodel_update(update_data)
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


@validate_call(config={"arbitrary_types_allowed": True})
async def delete_user(session: AsyncSession, user_id: UUID) -> bool:
    """Delete a user. Returns True if deleted, False if not found."""
    if not (user := await session.get(User, user_id)):
        return False
    await session.delete(user)
    await session.flush()
    return True


@validate_call(config={"arbitrary_types_allowed": True})
async def authenticate(
    session: AsyncSession, email: EmailStr, password: SecretStr
) -> User | None:
    """Authenticate user by email and password."""
    if not (user := await get_user_by_email(session, email)):
        return None
    if not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
