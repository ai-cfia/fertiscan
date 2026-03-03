"""Test the rule dependency."""

from uuid import UUID

import pytest
from app.db.models.rule import Rule
from app.dependencies.rule import get_rules_by_ids
from sqlmodel import select

from app.dependencies import SessionDep


@pytest.mark.usefixtures("override_dependencies")
class TestRuleDependency:
    """Test the rule dependency."""

    def test_get_rule_by_rule_id(self, db: SessionDep):
        """Test get_rules_by_ids."""

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule = db.scalars(stmt).first()
        assert rule is not None

        rules = get_rules_by_ids(rule_ids=[rule.id], session=db)

        assert len(rules) == 1
        assert rules[0].id == rule.id

    def test_get_two_rules_by_rule_id(self, db: SessionDep):
        """Test get_rules_by_ids with two rules."""

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule2 = db.scalars(stmt).first()
        assert rule2 is not None

        rules = get_rules_by_ids(rule_ids=[rule1.id, rule2.id], session=db)
        assert len(rules) == 2
        rule_ids = {r.id for r in rules}
        assert rule1.id in rule_ids
        assert rule2.id in rule_ids

    def test_with_three_rule_and_missing_one(self, db: SessionDep) -> None:
        """Test get_rules_by_ids with some missing rules doesn't raise exception by itself."""
        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule2 = db.scalars(stmt).first()
        assert rule2 is not None

        rules = get_rules_by_ids(
            rule_ids=[
                rule1.id,
                UUID("00000000-0000-0000-0000-000000000123"),
                rule2.id,
            ],
            session=db,
        )
        assert len(rules) == 2
        rule_ids = {r.id for r in rules}
        assert rule1.id in rule_ids
        assert rule2.id in rule_ids
