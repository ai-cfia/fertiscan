from enum import Enum


class ReviewStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class UploadStatus(str, Enum):
    pending = "pending"
    completed = "completed"


class ModifierType(str, Enum):
    EXEMPTION = "EXEMPTION"
    APPLICABILITY_CONDITION = "APPLICABILITY_CONDITION"


class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NOT_APPLICABLE = "not_applicable"
    INCONCLUSIVE = "inconclusive"


class ProductClassification(str, Enum):
    FERTILIZER = "fertilizer"
    SUPPLEMENT = "supplement"
    GROWING_MEDIUM = "growing_medium"
    TREATED_SEED = "treated_seed"
