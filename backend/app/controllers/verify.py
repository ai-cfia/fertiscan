"""Controller of verification of a product."""

import json
from typing import cast
from uuid import UUID

import instructor
from pydantic import validate_call
from sqlalchemy.orm import Session
from sqlmodel import select

from app.config import settings
from app.db.models.label import Label
from app.db.models.label_data import LabelData
from app.db.models.non_compliance_data_item import NonComplianceDataItem
from app.db.models.rule import Rule
from app.schemas.label import ComplianceResult

# ======================================General verification function for a label======================================


@validate_call(config={"arbitrary_types_allowed": True})
def verify_all_rules(session: Session, label: Label) -> Label:
    """Verify non-compliance data item of the label.
    All verifications should be addded in this function.

    Template for adding new verification:

    session = update_is_compliant(
        is_compliant=verification_lot_number(label_data),
        rule=get_rule_by_reference_number(<<reference_number>>, session=session),
        session=session,
        label=label,
    )
    """

    assert label.label_data is not None
    label = update_is_compliant(
        is_compliant=verification_lot_number(label.label_data),
        rule=get_rule_by_reference_number("FzR: 16.(1)(j)", session=session),
        session=session,
        label=label,
    )

    return label


@validate_call(config={"arbitrary_types_allowed": True})
async def verify_rules_for_label(
    label: Label,
    rules: list[Rule],
    instructor: instructor,
) -> dict[UUID, ComplianceResult]:
    dictComplianceResult = {}
    for rule in rules:
        if rule.ai_verify:
            dictComplianceResult[rule.id] = cast(
                ComplianceResult,
                await verify_specific_rule_ai(label, rule, instructor),
            )
        else:
            dictComplianceResult[rule.id] = verify_specific_rule(label, rule)
    return dictComplianceResult


# ===========================================Local verification ======================================
# TODO: Find another way to choose the verification function instead of using an match case statement
@validate_call(config={"arbitrary_types_allowed": True})
def verify_specific_rule(
    label: Label,
    rule: Rule,
) -> ComplianceResult:
    """Verify a specific rule on the label."""
    assert label.label_data is not None

    match rule.reference_number:
        case "FzR: 16.(1)(j)":
            cpr = ComplianceResult(
                explanation_fr=rule.description_fr,
                explanation_en=rule.description_en,
                is_compliant=verification_lot_number(label.label_data),
            )
    assert label is not None

    return cpr


# ======================================Update or create non-compliance data item======================================
@validate_call(config={"arbitrary_types_allowed": True})
def update_is_compliant(
    session: Session,
    label: Label,
    is_compliant: bool,
    rule: Rule,
) -> Label:
    """Update the is_compliant field of the non-compliance data item if the
    non-compliance data item already exists, otherwise create a new
    non-compliance data item."""

    stmt = select(NonComplianceDataItem).where(
        NonComplianceDataItem.rule_id == rule.id,
        NonComplianceDataItem.label_id == label.id,
    )
    non_compliance_data_item = session.scalars(stmt).first()

    if non_compliance_data_item is None:
        non_compliance_data_item = NonComplianceDataItem(
            label_id=label.id,
            rule_id=rule.id,
            description_en=rule.description_en,
            description_fr=rule.description_fr,
            is_compliant=is_compliant,
        )

        session.add(non_compliance_data_item)
        session.flush()
        session.refresh(label)
        return label

    non_compliance_data_item.is_compliant = is_compliant
    session.add(non_compliance_data_item)
    session.flush()
    session.refresh(label)
    return label


# ============================= Ordinary function of getter =====================================================
@validate_call(config={"arbitrary_types_allowed": True})
def get_rule_by_reference_number(
    reference_number: str,
    session: Session,
) -> Rule:
    """Get the rule with the given reference number."""
    stmt = select(Rule).where(Rule.reference_number == reference_number)
    rule = session.scalars(stmt).first()
    assert rule is not None, f"Rule with reference number {reference_number} not found"
    return rule


# ======================================Verification functions for each rule======================================
@validate_call(config={"arbitrary_types_allowed": True})
def verification_lot_number(label_data: LabelData) -> bool:
    """Verify if the lot number is present in the label data."""
    lot_number_data = label_data.lot_number

    if lot_number_data is None:
        return False

    if isinstance(lot_number_data, str):
        return bool(lot_number_data.strip())

    return True


# ============================== Verification with AI======================================
# TODO: Find another way to choose the prompt_method instead of using an match case statement
@validate_call(config={"arbitrary_types_allowed": True})
async def verify_specific_rule_ai(
    label: Label,
    rule: Rule,
    instructor: instructor,
) -> ComplianceResult:
    """Verify a specific rule with AI on the label."""
    assert label.label_data is not None

    match rule.reference_number:
        case "FzR: 15.(1)(i)":
            content = prompt_organic_matter(label, rule)

    assert content is not None
    return await verify_rule_with_llm(instructor, content)


@validate_call(config={"arbitrary_types_allowed": True})
async def verify_rule_with_llm(
    instructor: instructor,
    content: str,
) -> ComplianceResult:
    response, _ = await instructor.chat.completions.create_with_completion(
        model=settings.AZURE_OPENAI_MODEL,
        messages=[{"role": "user", "content": f"Analyze this : {content}"}],
        response_model=ComplianceResult,
        max_completion_tokens=4000,
    )
    assert response is not None
    return response


# =============================== Prompt engineering for LLM verification functions ===============================


def prompt_organic_matter(label: Label, rule: Rule) -> str:
    fertilizer_label_data = label.fertilizer_label_data
    assert fertilizer_label_data is not None
    ingredients = fertilizer_label_data.ingredients
    guaranteed_analysis = fertilizer_label_data.guaranteed_analysis

    prompt_template_env = settings.prompt_template_env
    template = prompt_template_env.get_template("compliance_verification.md")
    label_data = {
        "ingredients": ingredients,
        "guaranteed_analysis": guaranteed_analysis,
    }

    prompt = template.render(
        rule_data=json.dumps(rule.model_dump(mode="json"), indent=2),
        label_data=json.dumps(label_data, indent=2),
    )

    return prompt
