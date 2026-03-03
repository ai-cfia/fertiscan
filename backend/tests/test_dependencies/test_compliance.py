"""Test the non-compliance data item dependency."""

import pytest
from app.db.models.rule import Rule
from fastapi.testclient import TestClient
from sqlmodel import select

from app.dependencies import SessionDep
from app.dependencies.compliance import get_non_compliance_data_item_by_label_and_rule
from tests.factories.label import LabelFactory
from tests.factories.NonComplianceDataItem import NonComplianceDataItemFactory


@pytest.mark.usefixtures("override_dependencies")
class TestComplianceDependency:
    """Test the non-compliance data item dependency."""

    def test_get_compliance_by_label_and_rule(self, db: SessionDep, client: TestClient):
        """Test get a non compliance data item by them label and rule id."""
        stmt = select(Rule).where(Rule.reference_number == "FzR: 15.(1)(i)")
        rule = db.scalars(stmt).first()
        assert rule is not None

        label = LabelFactory.create(session=db)
        nonCompliance = NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            rule_id=rule.id,
            note="This is a note.",
            description_en="This is a description.",
            description_fr="Ceci est une description.",
            is_compliant=False,
        )

        non_compliance_data_item = get_non_compliance_data_item_by_label_and_rule(
            label=label,
            rule=rule,
            session=db,
        )

        assert non_compliance_data_item is not None
        assert non_compliance_data_item.id == nonCompliance.id
        assert non_compliance_data_item.label_id == label.id
        assert non_compliance_data_item.rule_id == rule.id
        assert non_compliance_data_item.note == "This is a note."
        assert non_compliance_data_item.description_en == "This is a description."
        assert non_compliance_data_item.description_fr == "Ceci est une description."
        assert non_compliance_data_item.is_compliant is False
