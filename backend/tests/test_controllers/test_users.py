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


class TestGetUsers:
    async def test_returns_users_and_count(self, db: AsyncSession) -> None:
        user1 = await create_random_user(db)
        user2 = await create_random_user(db)
        users, count = await get_users(db, skip=0, limit=100)
        assert count >= 2
        assert len(users) >= 2
        user_ids = [user.id for user in users]
        assert user1.id in user_ids
        assert user2.id in user_ids

    async def test_pagination(self, db: AsyncSession) -> None:
        await create_random_user(db)
        await create_random_user(db)
        users, count = await get_users(db, skip=0, limit=1)
        assert count >= 2
        assert len(users) == 1


class TestGetUserById:
    async def test_returns_user_when_found(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        result = await get_user_by_id(db, user_id=user.id)
        assert result is not None
        assert result.id == user.id
        assert result.email == user.email

    async def test_returns_none_when_not_found(self, db: AsyncSession) -> None:
        result = await get_user_by_id(db, user_id=uuid4())
        assert result is None


class TestGetUserByEmail:
    async def test_returns_user_when_found(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        result = await get_user_by_email(db, email=user.email)
        assert result is not None
        assert result.id == user.id
        assert result.email == user.email

    async def test_returns_none_when_not_found(self, db: AsyncSession) -> None:
        result = await get_user_by_email(db, email=random_email())
        assert result is None


class TestCreateUser:
    async def test_creates_and_returns_user(self, db: AsyncSession) -> None:
        email = random_email()
        password = random_lower_string()
        user_in = UserCreate(email=email, password=password)
        user = await create_user(db, user_in=user_in)
        assert user.id is not None
        assert user.email == email
        assert user.hashed_password is not None


class TestUpdateUser:
    async def test_updates_and_returns_user(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        user_in = UserUpdate(first_name="Updated", last_name="Name")
        result = await update_user(db, user_id=user.id, user_in=user_in)
        assert result is not None
        assert result.id == user.id
        assert result.first_name == "Updated"
        assert result.last_name == "Name"

    async def test_updates_password(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        original_hash = user.hashed_password
        new_password = random_lower_string()
        user_in = UserUpdate(password=new_password)
        result = await update_user(db, user_id=user.id, user_in=user_in)
        assert result is not None
        assert result.hashed_password is not None
        assert result.hashed_password != original_hash

    async def test_returns_none_when_not_found(self, db: AsyncSession) -> None:
        user_in = UserUpdate(first_name="Updated")
        result = await update_user(db, user_id=uuid4(), user_in=user_in)
        assert result is None


class TestDeleteUser:
    async def test_deletes_and_returns_true(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        result = await delete_user(db, user_id=user.id)
        assert result is True
        deleted = await get_user_by_id(db, user_id=user.id)
        assert deleted is None

    async def test_returns_false_when_not_found(self, db: AsyncSession) -> None:
        result = await delete_user(db, user_id=uuid4())
        assert result is False


class TestAuthenticate:
    async def test_returns_user_with_correct_password(self, db: AsyncSession) -> None:
        password = random_lower_string()
        user = await create_random_user(db)
        await update_user(db, user.id, UserUpdate(password=password))
        result = await authenticate(db, email=user.email, password=SecretStr(password))
        assert result is not None
        assert result.id == user.id
        assert result.email == user.email

    async def test_returns_none_when_user_not_found(self, db: AsyncSession) -> None:
        result = await authenticate(
            db, email=random_email(), password=SecretStr(random_lower_string())
        )
        assert result is None

    async def test_returns_none_when_no_password(self, db: AsyncSession) -> None:
        user = await create_random_user(db)
        user.hashed_password = None
        await db.flush()
        result = await authenticate(
            db, email=user.email, password=SecretStr(random_lower_string())
        )
        assert result is None

    async def test_returns_none_with_wrong_password(self, db: AsyncSession) -> None:
        password = random_lower_string()
        user = await create_random_user(db)
        await update_user(db, user.id, UserUpdate(password=password))
        result = await authenticate(
            db, email=user.email, password=SecretStr(random_lower_string())
        )
        assert result is None
