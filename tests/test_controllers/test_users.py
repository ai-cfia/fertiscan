"""User controller tests."""

from uuid import uuid4

from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.users import (
    authenticate,
    create_user,
    delete_user,
    get_user_by_email,
    get_user_by_id,
    get_users,
    update_user,
)
from app.schemas.user import UserCreate, UserUpdate
from tests.utils.user import create_random_user
from tests.utils.utils import random_email, random_lower_string


async def test_get_users(db: AsyncSession) -> None:
    """Test get_users returns users and count."""
    user1 = await create_random_user(db)
    user2 = await create_random_user(db)
    await db.commit()
    users, count = await get_users(db, skip=0, limit=100)
    assert count >= 2
    assert len(users) >= 2
    user_ids = [user.id for user in users]
    assert user1.id in user_ids
    assert user2.id in user_ids


async def test_get_users_pagination(db: AsyncSession) -> None:
    """Test get_users with pagination."""
    await create_random_user(db)
    await create_random_user(db)
    await db.commit()
    users, count = await get_users(db, skip=0, limit=1)
    assert count >= 2
    assert len(users) == 1


async def test_get_user_by_id(db: AsyncSession) -> None:
    """Test get_user_by_id returns user when found."""
    user = await create_random_user(db)
    await db.commit()
    result = await get_user_by_id(db, user_id=user.id)
    assert result is not None
    assert result.id == user.id
    assert result.email == user.email


async def test_get_user_by_id_not_found(db: AsyncSession) -> None:
    """Test get_user_by_id returns None when not found."""
    await db.commit()
    fake_id = uuid4()
    result = await get_user_by_id(db, user_id=fake_id)
    assert result is None


async def test_get_user_by_email(db: AsyncSession) -> None:
    """Test get_user_by_email returns user when found."""
    user = await create_random_user(db)
    await db.commit()
    result = await get_user_by_email(db, email=user.email)
    assert result is not None
    assert result.id == user.id
    assert result.email == user.email


async def test_get_user_by_email_not_found(db: AsyncSession) -> None:
    """Test get_user_by_email returns None when not found."""
    await db.commit()
    fake_email = random_email()
    result = await get_user_by_email(db, email=fake_email)
    assert result is None


async def test_create_user(db: AsyncSession) -> None:
    """Test create_user creates and returns user."""
    await db.commit()
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(email=email, password=password)
    user = await create_user(db, user_in=user_in)
    await db.commit()
    assert user.id is not None
    assert user.email == email
    assert user.hashed_password is not None


async def test_update_user(db: AsyncSession) -> None:
    """Test update_user updates and returns user."""
    user = await create_random_user(db)
    await db.commit()
    user_in = UserUpdate(first_name="Updated", last_name="Name")
    result = await update_user(db, user_id=user.id, user_in=user_in)
    await db.commit()
    assert result is not None
    assert result.id == user.id
    assert result.first_name == "Updated"
    assert result.last_name == "Name"


async def test_update_user_with_password(db: AsyncSession) -> None:
    """Test update_user updates password."""
    user = await create_random_user(db)
    await db.commit()
    original_hash = user.hashed_password
    new_password = random_lower_string()
    user_in = UserUpdate(password=new_password)
    result = await update_user(db, user_id=user.id, user_in=user_in)
    await db.commit()
    assert result is not None
    assert result.hashed_password is not None
    assert result.hashed_password != original_hash


async def test_update_user_not_found(db: AsyncSession) -> None:
    """Test update_user returns None when user not found."""
    await db.commit()
    fake_id = uuid4()
    user_in = UserUpdate(first_name="Updated")
    result = await update_user(db, user_id=fake_id, user_in=user_in)
    assert result is None


async def test_delete_user(db: AsyncSession) -> None:
    """Test delete_user deletes and returns True."""
    user = await create_random_user(db)
    await db.commit()
    result = await delete_user(db, user_id=user.id)
    await db.commit()
    assert result is True
    deleted = await get_user_by_id(db, user_id=user.id)
    assert deleted is None


async def test_delete_user_not_found(db: AsyncSession) -> None:
    """Test delete_user returns False when user not found."""
    await db.commit()
    fake_id = uuid4()
    result = await delete_user(db, user_id=fake_id)
    assert result is False


async def test_authenticate(db: AsyncSession) -> None:
    """Test authenticate returns user with correct password."""
    password = random_lower_string()
    user = await create_random_user(db)
    user_in_update = UserUpdate(password=password)
    await update_user(db, user.id, user_in_update)
    await db.commit()
    result = await authenticate(db, email=user.email, password=SecretStr(password))
    assert result is not None
    assert result.id == user.id
    assert result.email == user.email


async def test_authenticate_user_not_found(db: AsyncSession) -> None:
    """Test authenticate returns None when user not found."""
    await db.commit()
    fake_email = random_email()
    password = random_lower_string()
    result = await authenticate(db, email=fake_email, password=SecretStr(password))
    assert result is None


async def test_authenticate_no_password(db: AsyncSession) -> None:
    """Test authenticate returns None when user has no password."""
    user = await create_random_user(db)
    user.hashed_password = None
    await db.commit()
    password = random_lower_string()
    result = await authenticate(db, email=user.email, password=SecretStr(password))
    assert result is None


async def test_authenticate_wrong_password(db: AsyncSession) -> None:
    """Test authenticate returns None with wrong password."""
    password = random_lower_string()
    user = await create_random_user(db)
    user_in_update = UserUpdate(password=password)
    await update_user(db, user.id, user_in_update)
    await db.commit()
    wrong_password = random_lower_string()
    result = await authenticate(
        db, email=user.email, password=SecretStr(wrong_password)
    )
    assert result is None
