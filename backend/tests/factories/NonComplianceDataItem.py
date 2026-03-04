"""Factory for Non compliance data item"""

from app.db.models.enums import ComplianceStatus
from app.db.models.non_compliance_data_item import NonComplianceDataItem
from tests.factories import BaseFactory


class NonComplianceDataItemFactory(BaseFactory):
    class Meta:
        model = NonComplianceDataItem

    requirement_id = None
    label_id = None
    note = None
    description_en = None
    description_fr = None
    status = ComplianceStatus.INCONCLUSIVE
