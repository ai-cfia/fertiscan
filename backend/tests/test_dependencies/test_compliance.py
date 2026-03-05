"""Test the non-compliance data item dependency."""

import pytest
from fastapi.testclient import TestClient

from app.dependencies import SessionDep
from app.dependencies.compliance import (
    get_non_compliance_data_item_by_label_and_requirement,
)
from tests.factories.label import LabelFactory
from tests.factories.NonComplianceDataItem import NonComplianceDataItemFactory
from tests.factories.requirement import RequirementFactory


@pytest.mark.usefixtures("override_dependencies")
class TestComplianceDependency:
    """Test the non-compliance data item dependency."""

    def test_get_compliance_by_label_and_requirement(
        self, db: SessionDep, client: TestClient
    ):
        """Test get a non compliance data item by their label and requirement id."""
        requirement = RequirementFactory.create(session=db)

        label = LabelFactory.create(session=db)
        non_compliance = NonComplianceDataItemFactory.create(
            session=db,
            label_id=label.id,
            requirement_id=requirement.id,
            note="This is a note.",
            description_en="This is a description.",
            description_fr="Ceci est une description.",
            status="NON_COMPLIANT",
        )

        non_compliance_data_item = (
            get_non_compliance_data_item_by_label_and_requirement(
                label=label,
                requirement=requirement,
                session=db,
            )
        )

        assert non_compliance_data_item is not None
        assert non_compliance_data_item.id == non_compliance.id
        assert non_compliance_data_item.label_id == label.id
        assert non_compliance_data_item.requirement_id == requirement.id
        assert non_compliance_data_item.note == "This is a note."
        assert non_compliance_data_item.description_en == "This is a description."
        assert non_compliance_data_item.description_fr == "Ceci est une description."
        assert non_compliance_data_item.status == "NON_COMPLIANT"
