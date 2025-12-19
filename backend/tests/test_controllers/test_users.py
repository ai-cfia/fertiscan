"""User controller tests."""

from uuid import uuid4

from pydantic import SecretStr
from sqlalchemy.orm import Session

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
from tests.factories.user import UserFactory
from tests.utils import fake


class TestGetUsers:
    def test_returns_users_and_count(self, db: Session) -> None:
        user1 = UserFactory()
        user2 = UserFactory()
        users, count = get_users(db, skip=0, limit=100)
        assert count >= 2
        assert len(users) >= 2
        user_ids = [user.id for user in users]
        assert user1.id in user_ids
        assert user2.id in user_ids

    def test_pagination(self, db: Session) -> None:
        UserFactory()
        UserFactory()
        users, count = get_users(db, skip=0, limit=1)
        assert count >= 2
        assert len(users) == 1


class TestGetUserById:
    def test_returns_user_when_found(self, db: Session) -> None:
        user = UserFactory()
        result = get_user_by_id(db, user_id=user.id)
        assert result is not None
        assert result.id == user.id
        assert result.email == user.email

    def test_returns_none_when_not_found(self, db: Session) -> None:
        result = get_user_by_id(db, user_id=uuid4())
        assert result is None


class TestGetUserByEmail:
    def test_returns_user_when_found(self, db: Session) -> None:
        user = UserFactory()
        result = get_user_by_email(db, email=user.email)
        assert result is not None
        assert result.id == user.id
        assert result.email == user.email

    def test_returns_none_when_not_found(self, db: Session) -> None:
        result = get_user_by_email(db, email=fake.email())
        assert result is None


class TestCreateUser:
    def test_creates_and_returns_user(self, db: Session) -> None:
        email = fake.email()
        password = fake.password()
        user_in = UserCreate(email=email, password=password)
        user = create_user(db, user_in=user_in)
        assert user.id is not None
        assert user.email == email
        assert user.hashed_password is not None


class TestUpdateUser:
    def test_updates_and_returns_user(self, db: Session) -> None:
        user = UserFactory()
        user_in = UserUpdate(first_name="Updated", last_name="Name")
        result = update_user(db, user_id=user.id, user_in=user_in)
        assert result is not None
        assert result.id == user.id
        assert result.first_name == "Updated"
        assert result.last_name == "Name"

    def test_updates_password(self, db: Session) -> None:
        user = UserFactory()
        original_hash = user.hashed_password
        new_password = fake.password()
        user_in = UserUpdate(password=new_password)
        result = update_user(db, user_id=user.id, user_in=user_in)
        assert result is not None
        assert result.hashed_password is not None
        assert result.hashed_password != original_hash

    def test_returns_none_when_not_found(self, db: Session) -> None:
        user_in = UserUpdate(first_name="Updated")
        result = update_user(db, user_id=uuid4(), user_in=user_in)
        assert result is None


class TestDeleteUser:
    def test_deletes_and_returns_true(self, db: Session) -> None:
        user = UserFactory()
        result = delete_user(db, user_id=user.id)
        assert result is True
        deleted = get_user_by_id(db, user_id=user.id)
        assert deleted is None

    def test_returns_false_when_not_found(self, db: Session) -> None:
        result = delete_user(db, user_id=uuid4())
        assert result is False


class TestAuthenticate:
    def test_returns_user_with_correct_password(self, db: Session) -> None:
        user = UserFactory()
        result = authenticate(db, email=user.email, password=SecretStr("testpass123"))
        assert result is not None
        assert result.id == user.id
        assert result.email == user.email

    def test_returns_none_when_user_not_found(self, db: Session) -> None:
        result = authenticate(
            db, email=fake.email(), password=SecretStr(fake.password())
        )
        assert result is None

    def test_returns_none_when_no_password(self, db: Session) -> None:
        user = UserFactory()
        user.hashed_password = None
        db.flush()
        result = authenticate(db, email=user.email, password=SecretStr(fake.password()))
        assert result is None

    def test_returns_none_with_wrong_password(self, db: Session) -> None:
        user = UserFactory()
        result = authenticate(db, email=user.email, password=SecretStr(fake.password()))
        assert result is None
