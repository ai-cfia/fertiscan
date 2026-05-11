"""Database helpers for the compliance benchmark."""

from typing import Any, cast

from sqlalchemy import ColumnElement
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.db.models.legislation import Legislation
from app.db.models.provision import Provision
from app.db.models.requirement import Requirement, RequirementModifier
from app.db.session import get_sessionmaker


def isolate_requirements_by_id() -> list[Requirement]:
    """Return all requirements ordered by their identifier."""

    with get_sessionmaker()() as session:
        stmt = (
            select(Requirement)
            .options(
                selectinload(cast(Any, Requirement.provisions)).selectinload(
                    cast(Any, Provision.definitions)
                ),
                selectinload(cast(Any, Requirement.modifiers))
                .selectinload(cast(Any, RequirementModifier.provision))
                .selectinload(cast(Any, Provision.definitions)),
                selectinload(cast(Any, Requirement.legislation)).selectinload(
                    cast(Any, Legislation.general_exemptions)
                ),
            )
            .order_by(cast(ColumnElement[Any], Requirement.id))
        )
        return list(session.exec(stmt).all())
