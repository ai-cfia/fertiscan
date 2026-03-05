"""Test the requirement dependency."""

from uuid import UUID

import pytest
from sqlmodel import select

from app.db.models.requirement import Requirement
from app.dependencies import SessionDep
from app.dependencies.requirement import get_requirements_by_ids


@pytest.mark.usefixtures("override_dependencies")
class TestRequirementDependency:
    """Test the requirement dependency."""

    def test_get_requirement_by_id(self, db: SessionDep):
        """Test get_requirements_by_ids."""

        stmt = select(Requirement).where(Requirement.title_en == "Lot Number Presence")
        requirement = db.scalars(stmt).first()
        assert requirement is not None

        requirements = get_requirements_by_ids(
            requirement_ids=[requirement.id], session=db
        )

        assert len(requirements) == 1
        assert requirements[0].id == requirement.id

    def test_get_two_requirements_by_id(self, db: SessionDep):
        """Test get_requirements_by_ids with two requirements."""

        stmt = select(Requirement).where(Requirement.title_en == "Lot Number Presence")
        req1 = db.scalars(stmt).first()
        assert req1 is not None

        stmt = select(Requirement).where(
            Requirement.title_en == "Guaranteed Analysis Presence"
        )
        req2 = db.scalars(stmt).first()
        assert req2 is not None

        requirements = get_requirements_by_ids(
            requirement_ids=[req1.id, req2.id], session=db
        )
        assert len(requirements) == 2
        req_ids = {r.id for r in requirements}
        assert req1.id in req_ids
        assert req2.id in req_ids

    def test_with_three_requirement_and_missing_one(self, db: SessionDep) -> None:
        """Test get_requirements_by_ids with some missing requirements doesn't raise exception by itself."""
        stmt = select(Requirement).where(Requirement.title_en == "Lot Number Presence")
        req1 = db.scalars(stmt).first()
        assert req1 is not None

        stmt = select(Requirement).where(
            Requirement.title_en == "Guaranteed Analysis Presence"
        )
        req2 = db.scalars(stmt).first()
        assert req2 is not None

        requirements = get_requirements_by_ids(
            requirement_ids=[
                req1.id,
                UUID("00000000-0000-0000-0000-000000000123"),
                req2.id,
            ],
            session=db,
        )
        assert len(requirements) == 2
        req_ids = {r.id for r in requirements}
        assert req1.id in req_ids
        assert req2.id in req_ids
