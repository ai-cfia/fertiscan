# Prompt Engineering

The compliance prompt template lives at
[`backend/app/prompt_templates/compliance_verification.md`](../../backend/app/prompt_templates/compliance_verification.md)
(configurable via `PROMPT_TEMPLATES_DIR` and `COMPLIANCE_PROMPT_TEMPLATE`).
It is rendered per requirement by `render_prompt` in
`backend/app/services/compliance.py`, from a context assembled around the
`Requirement` hub by `build_context`.

The template file is the source of truth — this doc describes its structure,
not its exact wording.

## Template Structure

All variables use the `| safe` filter to prevent HTML escaping of JSON and
technical legal text, ensuring the LLM receives verbatim data.

| Section | Variable | Built from |
| --- | --- | --- |
| Dictionary | `dictionary` | Definitions linked to the requirement's provisions (`ProvisionDefinition`) |
| General Exemptions | `general_exemptions` | Provisions flagged `is_general_exemption` on the legislation |
| Exemptions | `exemptions` | `RequirementModifier` rows of type `EXEMPTION` |
| Applicability Conditions | `applicability_conditions` | `RequirementModifier` rows of type `APPLICABILITY_CONDITION` |
| Requirement | `requirement` | The requirement's linked provisions (`RequirementProvision`) |
| Label Data | `label_data` | The label's data serialized as JSON |

## Verification Protocol

The template instructs the LLM to evaluate in a fixed short-circuiting order:

1. Establish strict legal definitions from the **Dictionary**.
2. Check **General Exemptions** — if the product is generally exempt, stop.
3. Check **Exemptions** — if one applies, return `NOT_APPLICABLE`.
4. Check **Applicability Conditions** — if one is unmet, return
   `NOT_APPLICABLE`.
5. Evaluate compliance exclusively against the **Requirement**.

Constraints: no assuming data absent from the label, decisions based solely on
the provided legal texts, conclusions supported by specific label evidence,
strict (non-colloquial) application of definitions, and `INCONCLUSIVE`
reserved for label data that is ambiguous, illegible, or requiring
verification beyond the provided context.

The interpretation rules the LLM must follow are specified in
[interpretation-logic.md](interpretation-logic.md).
