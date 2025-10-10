"""Base repository with CRUD operations and pagination."""

import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

ModelType = TypeVar("ModelType", bound=SQLModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def create(self, obj_in: dict[str, Any] | ModelType) -> ModelType:
        if isinstance(obj_in, dict):
            db_obj = self.model(**obj_in)
        else:
            db_obj = self.model.model_validate(obj_in)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def get(self, id: uuid.UUID) -> ModelType | None:
        return await self.session.get(self.model, id)

    async def get_multi(self, *, skip: int = 0, limit: int = 100) -> list[ModelType]:
        statement = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_count(self) -> int:
        statement = select(func.count()).select_from(self.model)
        result = await self.session.execute(statement)
        return result.scalar_one()

    async def update(
        self, *, db_obj: ModelType, obj_in: dict[str, Any] | ModelType
    ) -> ModelType:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        db_obj.sqlmodel_update(update_data)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, *, id: uuid.UUID) -> bool:
        db_obj = await self.session.get(self.model, id)
        if db_obj:
            await self.session.delete(db_obj)
            await self.session.flush()
            return True
        return False
