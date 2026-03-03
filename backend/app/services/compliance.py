from typing import TYPE_CHECKING
from uuid import UUID

from instructor import AsyncInstructor

if TYPE_CHECKING:
    from app.db.models.definition import Definition

from app.config import settings
from app.db.models.enums import ModifierType
from app.db.models.label import Label
from app.db.models.requirement import Requirement
from app.schemas.label import ComplianceResult, LabelEvaluationContext


def get_requirement_dictionary(requirement: Requirement) -> str:
    """
    Extract and deduplicate definitions from all provisions and modifiers
    associated with a requirement. Returns a bulleted list of English definitions.
    """
    definitions: dict[UUID, Definition] = {}

    # Gather definitions from rules (provisions)
    for provision in requirement.provisions:
        for definition in provision.definitions:
            definitions[definition.id] = definition

    # Gather definitions from modifiers (exemptions, applicability conditions)
    for modifier in requirement.modifiers:
        for definition in modifier.provision.definitions:
            definitions[definition.id] = definition

    if not definitions:
        return ""

    # Sort for deterministic output
    sorted_definitions = sorted(definitions.values(), key=lambda d: d.title_en)

    lines = [f"- {d.title_en}: {d.text_en}" for d in sorted_definitions]
    return "\n".join(lines)


def get_global_exemptions(requirement: Requirement) -> str:
    """
    Extract global rules (often exemptions) from the database for the given legislation.
    Returns a bulleted list of English texts.
    """
    if not requirement.legislation.global_provisions:
        return ""

    # Sort for deterministic output
    sorted_provisions = sorted(
        requirement.legislation.global_provisions, key=lambda p: p.citation
    )
    lines = [f"- {p.citation}: {p.text_en}" for p in sorted_provisions]
    return "\n".join(lines)


def get_exemptions(requirement: Requirement) -> str:
    """
    Format exemptions into a bulleted list of English texts.
    Sorted by citation for deterministic output.
    """
    exemptions = [
        m.provision for m in requirement.modifiers if m.type == ModifierType.EXEMPTION
    ]
    if not exemptions:
        return ""
    sorted_provisions = sorted(exemptions, key=lambda p: p.citation)
    lines = [f"- {p.citation}: {p.text_en}" for p in sorted_provisions]
    return "\n".join(lines)


def get_applicability_conditions(requirement: Requirement) -> str:
    """
    Format applicability conditions into a bulleted list of English texts.
    Sorted by citation for deterministic output.
    """
    conditions = [
        m.provision
        for m in requirement.modifiers
        if m.type == ModifierType.APPLICABILITY_CONDITION
    ]
    if not conditions:
        return ""
    sorted_provisions = sorted(conditions, key=lambda p: p.citation)
    lines = [f"- {p.citation}: {p.text_en}" for p in sorted_provisions]
    return "\n".join(lines)


def get_requirement_provisions(requirement: Requirement) -> str:
    """
    Format the core provisions of the requirement into a bulleted list.
    Sorted by citation for deterministic output.
    """
    if not requirement.provisions:
        return ""
    sorted_provisions = sorted(requirement.provisions, key=lambda p: p.citation)
    lines = [f"- {p.citation}: {p.text_en}" for p in sorted_provisions]
    return "\n".join(lines)


def get_label_data_json(label: Label) -> str:
    """
    Serialize the label and its associated technical data into a JSON string
    suitable for LLM evaluation.
    """
    return LabelEvaluationContext.model_validate(label).model_dump_json(
        exclude_none=True
    )


def build_context(label: Label, requirement: Requirement) -> dict[str, str]:
    """
    Gather all necessary legislative context (provisions, exemptions, etc.)
    and label data for the given requirement evaluation.
    """
    return {
        "dictionary": get_requirement_dictionary(requirement),
        "global_exemptions": get_global_exemptions(requirement),
        "exemptions": get_exemptions(requirement),
        "applicability_conditions": get_applicability_conditions(requirement),
        "provisions": get_requirement_provisions(requirement),
        "label_data": get_label_data_json(label),
    }


def render_prompt(context: dict[str, str]) -> str:
    """
    Render the LLM prompt using the provided template and gathered context.
    """
    return settings.prompt_template_env.get_template(
        "compliance_verification.md"
    ).render(
        dictionary=context.get("dictionary", ""),
        global_exemptions=context.get("global_exemptions", ""),
        exemptions=context.get("exemptions", ""),
        applicability_conditions=context.get("applicability_conditions", ""),
        requirement=context.get("provisions", ""),
        label_data=context.get("label_data", ""),
    )


async def evaluate_requirement(
    instructor_client: AsyncInstructor,
    label: Label,
    requirement: Requirement,
) -> ComplianceResult:
    """
    Execute the full compliance evaluation flow for a single requirement.
    """
    context = build_context(label, requirement)
    prompt = render_prompt(context=context)

    response, _ = await instructor_client.chat.completions.create_with_completion(
        model=settings.AZURE_OPENAI_MODEL,
        response_model=ComplianceResult,
        messages=[{"role": "user", "content": prompt}],
    )

    return response
