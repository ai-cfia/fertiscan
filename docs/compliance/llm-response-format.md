# LLM Response Format

The LLM response is parsed into a structured `ComplianceResult`:

```python
class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NOT_APPLICABLE = "not_applicable"
    INCONCLUSIVE = "inconclusive"

class ComplianceResult(BaseModel):
    status: ComplianceStatus = Field(
        ...,
        description="Outcome of the check. COMPLIANT, NON_COMPLIANT, NOT_APPLICABLE, or INCONCLUSIVE (requires human review)."
    )
    explanation_en: str = Field(
        ...,
        description="Step-by-step reasoning citing specific evidence from the Label Data that supports or contradicts the regulation's requirements. in English",
    )
    explanation_fr: str = Field(
        ...,
        description="Step-by-step reasoning citing specific evidence from the Label Data that supports or contradicts the regulation's requirements. in French",
    )
```

- `COMPLIANT` (`compliant`) — The label satisfies the requirement.
- `NON_COMPLIANT` (`non_compliant`) — The label violates the requirement.
- `NOT_APPLICABLE` (`not_applicable`) — An exemption or applicability condition
  short-circuited the evaluation.
- `INCONCLUSIVE` (`inconclusive`) — The provided data is insufficient,
  ambiguous, or contradicts the requirement in a way that prevents a clear
  determination. Requires human review.
