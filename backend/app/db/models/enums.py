from enum import StrEnum


class ReviewStatus(StrEnum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class UploadStatus(StrEnum):
    pending = "pending"
    completed = "completed"


class ModifierType(StrEnum):
    EXEMPTION = "EXEMPTION"
    APPLICABILITY_CONDITION = "APPLICABILITY_CONDITION"


class ComplianceStatus(StrEnum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NOT_APPLICABLE = "not_applicable"
    INCONCLUSIVE = "inconclusive"


class ProductClassification(StrEnum):
    FERTILIZER = "fertilizer"
    SUPPLEMENT = "supplement"
    GROWING_MEDIUM = "growing_medium"
    TREATED_SEED = "treated_seed"
