"""Factory for Non compliance data item"""

from app.db.models.non_compliance_data_item import NonComplianceDataItem
from tests.factories import BaseFactory


class NonComplianceDataItemFactory(BaseFactory):
    class Meta:
        model = NonComplianceDataItem

    rule_id = None
    label_id = None
    note = None
    description_en = None
    description_fr = None
    is_compliant = False
