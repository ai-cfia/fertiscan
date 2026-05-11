"""Compliance status helpers for the benchmark."""

from app.db.models import ComplianceStatus

STATUS_ALIASES = {
    "na": ComplianceStatus.NOT_APPLICABLE.value,
    "n_a": ComplianceStatus.NOT_APPLICABLE.value,
    "notapplicable": ComplianceStatus.NOT_APPLICABLE.value,
    "noncompliant": ComplianceStatus.NON_COMPLIANT.value,
    "non_compliance": ComplianceStatus.NON_COMPLIANT.value,
    "inconclusive_review": ComplianceStatus.INCONCLUSIVE.value,
}


def normalize_compliance_status(value: object) -> str | None:
    """Normalize status-like values to canonical ComplianceStatus strings."""

    if value is None:
        return None

    status_text = str(getattr(value, "value", value))
    normalized_status = status_text.strip().lower().replace("-", "_").replace(" ", "_")
    canonical = STATUS_ALIASES.get(normalized_status, normalized_status)

    allowed = {status.value for status in ComplianceStatus}
    if canonical not in allowed:
        raise ValueError(
            "Invalid expected_status "
            f"{status_text!r}. Allowed values: {', '.join(sorted(allowed))}"
        )

    return canonical


def compliance_status_values() -> set[str]:
    """Return the canonical string values accepted by the benchmark."""

    return {status.value for status in ComplianceStatus}
