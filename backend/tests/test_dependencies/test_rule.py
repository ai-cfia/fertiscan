"""Test the rule dependency."""

from uuid import UUID

import pytest
from sqlmodel import select

from app.db.models.rule import Rule
from app.dependencies import SessionDep
from app.dependencies.rule import get_rule_by_reference_number
from app.exceptions import RuleNotFound


@pytest.mark.usefixtures("override_dependencies")
class TestRuleDependency:
    """Test the rule dependency."""

    def test_get_rule_by_rule_id(self, db: SessionDep):
        """Test get_rule_by_rule_id."""

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule = db.scalars(stmt).first()
        assert rule is not None

        rules = get_rule_by_reference_number(rule_ids=[rule.id], session=db)

        assert len(rules) == 1
        assert rules[0].id == rule.id

    def test_get_two_rules_by_rule_id(self, db: SessionDep):
        """Test get_rule_by_rule_id with two rules."""

        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule2 = db.scalars(stmt).first()
        assert rule2 is not None

        rules = get_rule_by_reference_number(rule_ids=[rule1.id, rule2.id], session=db)
        assert len(rules) == 2
        assert rules[0].id == rule1.id
        assert rules[1].id == rule2.id

    def test_with_three_rule_and_one_error(self, db: SessionDep) -> None:
        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule1 = db.scalars(stmt).first()
        assert rule1 is not None

        stmt = select(Rule).where(Rule.reference_number == "FzR: 16.(1)(j)")
        rule2 = db.scalars(stmt).first()
        assert rule2 is not None

        try:
            get_rule_by_reference_number(
                rule_ids=[
                    rule1.id,
                    UUID("00000000-0000-0000-0000-000000000123"),
                    rule2.id,
                ],
                session=db,
            )
            raise AssertionError("Expected RuleNotFound exception was not raised")
        except Exception as e:
            assert isinstance(e, RuleNotFound)
