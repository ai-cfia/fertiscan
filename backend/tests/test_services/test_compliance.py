from sqlalchemy.orm import Session

from app.db.models.enums import ModifierType
from app.dependencies.labels import get_label_by_id
from app.services.compliance import (
    build_context,
    get_applicability_conditions,
    get_exemptions,
    get_global_exemptions,
    get_label_data_json,
    get_requirement_dictionary,
    get_requirement_provisions,
    render_prompt,
)
from tests.factories.definition import DefinitionFactory
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label_data import LabelDataFactory
from tests.factories.provision import ProvisionFactory
from tests.factories.requirement import (
    RequirementFactory,
    RequirementModifierFactory,
)


class TestGetRequirementDictionary:
    """Tests for the get_requirement_dictionary helper function."""

    def test_get_requirement_dictionary_empty(self, db: Session) -> None:
        """Test returning an empty string when no definitions are present."""
        requirement = RequirementFactory.create()
        # Ensure they are empty
        requirement.provisions = []
        requirement.modifiers = []
        db.flush()

        assert get_requirement_dictionary(requirement) == ""

    def test_get_requirement_dictionary_single(self, db: Session) -> None:
        """Test formatting a single definition."""
        legislation = RequirementFactory.create().legislation
        definition = DefinitionFactory.create(
            legislation=legislation, title_en="Term A", text_en="Definition A"
        )

        provision = ProvisionFactory.create(legislation=legislation)
        provision.definitions.append(definition)

        requirement = RequirementFactory.create(legislation=legislation)
        requirement.provisions.append(provision)
        db.flush()

        result = get_requirement_dictionary(requirement)
        assert result == "- Term A: Definition A"

    def test_get_requirement_dictionary_deduplication(self, db: Session) -> None:
        """Test that definitions are not duplicated in the output."""
        legislation = RequirementFactory.create().legislation
        definition = DefinitionFactory.create(
            legislation=legislation, title_en="Term A", text_en="Definition A"
        )

        provision = ProvisionFactory.create(legislation=legislation)
        provision.definitions.append(definition)

        modifier = ProvisionFactory.create(legislation=legislation)
        modifier.definitions.append(definition)

        requirement = RequirementFactory.create(legislation=legislation)
        requirement.provisions.append(provision)

        # Use RequirementModifier factory explicitly to set the type
        RequirementModifierFactory.create(
            requirement=requirement,
            provision=modifier,
            type=ModifierType.EXEMPTION,
        )
        db.flush()
        db.refresh(requirement)

        # Should only appear once
        result = get_requirement_dictionary(requirement)
        assert result == "- Term A: Definition A"

    def test_get_requirement_dictionary_sorting(self, db: Session) -> None:
        """Test that definitions are sorted alphabetically by title."""
        legislation = RequirementFactory.create().legislation
        def_b = DefinitionFactory.create(
            legislation=legislation, title_en="Term B", text_en="Definition B"
        )
        def_a = DefinitionFactory.create(
            legislation=legislation, title_en="Term A", text_en="Definition A"
        )

        provision = ProvisionFactory.create(legislation=legislation)
        provision.definitions.extend([def_b, def_a])

        requirement = RequirementFactory.create(legislation=legislation)
        requirement.provisions.append(provision)
        db.flush()

        result = get_requirement_dictionary(requirement)
        expected = "- Term A: Definition A\n- Term B: Definition B"
        assert result == expected

    def test_get_requirement_dictionary_multiple_sources(self, db: Session) -> None:
        """Test aggregating definitions from provisions and modifiers."""
        legislation = RequirementFactory.create().legislation
        def_a = DefinitionFactory.create(
            legislation=legislation, title_en="Term A", text_en="Definition A"
        )
        def_b = DefinitionFactory.create(
            legislation=legislation, title_en="Term B", text_en="Definition B"
        )

        provision = ProvisionFactory.create(legislation=legislation)
        provision.definitions.append(def_a)

        modifier = ProvisionFactory.create(legislation=legislation)
        modifier.definitions.append(def_b)

        requirement = RequirementFactory.create(legislation=legislation)
        requirement.provisions.append(provision)

        # Use RequirementModifier factory explicitly to set the type
        RequirementModifierFactory.create(
            requirement=requirement,
            provision=modifier,
            type=ModifierType.EXEMPTION,
        )
        db.flush()
        db.refresh(requirement)

        result = get_requirement_dictionary(requirement)
        assert "- Term A: Definition A" in result
        assert "- Term B: Definition B" in result
        assert result.count("- ") == 2


class TestGetGlobalExemptions:
    """Tests for the get_global_exemptions helper function."""

    def test_get_global_exemptions_empty(self, db: Session) -> None:
        """Test returning an empty string when no global rules exist."""
        requirement = RequirementFactory.create()
        # Provisions are linked to legislation via factory, but let's be explicit
        requirement.legislation.provisions = []
        db.flush()

        assert get_global_exemptions(requirement) == ""

    def test_get_global_exemptions_single(self, db: Session) -> None:
        """Test formatting a single global rule."""
        requirement = RequirementFactory.create()
        # Use factory to handle citation uniqueness and link to legislation
        ProvisionFactory.create(
            legislation=requirement.legislation,
            text_en="Exemption A",
            is_global_rule=True,
            citation="Global-1",
        )
        db.flush()
        db.refresh(requirement.legislation)

        result = get_global_exemptions(requirement)
        assert result == "- Global-1: Exemption A"

    def test_get_global_exemptions_multiple_sorting(self, db: Session) -> None:
        """Test that multiple global rules are sorted by citation."""
        requirement = RequirementFactory.create()
        ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="B",
            text_en="Exemption B",
            is_global_rule=True,
        )
        ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="A",
            text_en="Exemption A",
            is_global_rule=True,
        )
        db.flush()
        db.refresh(requirement.legislation)

        result = get_global_exemptions(requirement)
        expected = "- A: Exemption A\n- B: Exemption B"
        assert result == expected

    def test_get_global_exemptions_filters_non_global(self, db: Session) -> None:
        """Test that only global rules are included."""
        requirement = RequirementFactory.create()
        ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="Global-A",
            text_en="Exemption A",
            is_global_rule=True,
        )
        ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="Regular-A",
            text_en="Standard Rule",
            is_global_rule=False,
        )
        db.flush()
        db.refresh(requirement.legislation)

        result = get_global_exemptions(requirement)
        assert result == "- Global-A: Exemption A"


class TestRequirementModifiers:
    """Tests for the helper functions that extract modifiers (exemptions and conditions)."""

    def test_get_exemptions_empty(self, db: Session) -> None:
        """Test returning an empty string when no exemptions exist."""
        requirement = RequirementFactory.create()
        db.flush()

        assert get_exemptions(requirement) == ""

    def test_get_applicability_conditions_empty(self, db: Session) -> None:
        """Test returning an empty string when no applicability conditions exist."""
        requirement = RequirementFactory.create()
        db.flush()

        assert get_applicability_conditions(requirement) == ""

    def test_modifiers_success(self, db: Session) -> None:
        """Test fetching correctly by type using the explicit relationships."""
        requirement = RequirementFactory.create()
        exemption_prov = ProvisionFactory.create(
            legislation=requirement.legislation, citation="Ex-1", text_en="Exemption A"
        )
        condition_prov = ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="Cond-1",
            text_en="Condition A",
        )

        RequirementModifierFactory.create(
            requirement=requirement,
            provision=exemption_prov,
            type=ModifierType.EXEMPTION,
        )
        RequirementModifierFactory.create(
            requirement=requirement,
            provision=condition_prov,
            type=ModifierType.APPLICABILITY_CONDITION,
        )
        db.flush()
        db.refresh(requirement)

        # Check exemption
        assert get_exemptions(requirement) == "- Ex-1: Exemption A"

        # Check condition
        assert get_applicability_conditions(requirement) == "- Cond-1: Condition A"

    def test_modifiers_sorting(self, db: Session) -> None:
        """Test that multiple modifiers of the same type are sorted by citation."""
        requirement = RequirementFactory.create()
        ex_b = ProvisionFactory.create(
            legislation=requirement.legislation, citation="B", text_en="Exemption B"
        )
        ex_a = ProvisionFactory.create(
            legislation=requirement.legislation, citation="A", text_en="Exemption A"
        )

        RequirementModifierFactory.create(
            requirement=requirement, provision=ex_b, type=ModifierType.EXEMPTION
        )
        RequirementModifierFactory.create(
            requirement=requirement, provision=ex_a, type=ModifierType.EXEMPTION
        )
        db.flush()
        db.refresh(requirement)

        result = get_exemptions(requirement)
        expected = "- A: Exemption A\n- B: Exemption B"
        assert result == expected


class TestGetRequirementProvisions:
    """Tests for the get_requirement_provisions helper function."""

    def test_get_provisions_empty(self, db: Session) -> None:
        """Test returning an empty string when no provisions exist."""
        requirement = RequirementFactory.create()
        requirement.provisions = []
        db.flush()

        assert get_requirement_provisions(requirement) == ""

    def test_get_provisions_sorting(self, db: Session) -> None:
        """Test that provisions are sorted by citation."""
        requirement = RequirementFactory.create(guidance_en="")
        p_b = ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="Provision-B",
            text_en="Text B",
        )
        p_a = ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="Provision-A",
            text_en="Text A",
        )
        requirement.provisions.append(p_b)
        requirement.provisions.append(p_a)
        db.flush()
        db.refresh(requirement)

        result = get_requirement_provisions(requirement)
        expected = "- Provision-A: Text A\n- Provision-B: Text B"
        assert result == expected


class TestGetLabelDataJson:
    """Tests for the get_label_data_json helper function."""

    def test_prompt_contains_label_data_and_fertilizer_data_when_from_get_label_by_id(
        self, db: Session
    ) -> None:
        """Prompt built from label via get_label_by_id (CompletedLabelDep path) contains
        both label_data and fertilizer_label_data."""
        label_data = LabelDataFactory.create(
            brand_name={"en": "PromptBrandXYZ"},
            registration_number="1234567F",
        )
        FertilizerLabelDataFactory.create(label=label_data.label, n=10, p=5, k=5)
        db.flush()
        db.expire_all()
        label = get_label_by_id(db, label_data.label.id)
        requirement = RequirementFactory.create()
        db.refresh(requirement)
        context = build_context(label, requirement)
        prompt = render_prompt(context)
        assert "PromptBrandXYZ" in prompt
        assert "1234567F" in prompt
        assert '"n"' in prompt
        assert '"10"' in prompt

    def test_get_label_data_json_basic(self, db: Session) -> None:
        """Test that label data is correctly serialized to JSON."""
        label_data = LabelDataFactory.create(
            brand_name={"en": "GreenGrow"},
            registration_number="1234567F",
        )
        label = label_data.label
        FertilizerLabelDataFactory.create(label=label, n=10, p=5, k=5)
        result_json = get_label_data_json(label)
        assert "GreenGrow" in result_json
        assert "1234567F" in result_json
        assert '"n"' in result_json
        assert '"10"' in result_json
        # Check for the bilingual structure in the output
        assert '"en"' in result_json


class TestBuildContext:
    """Tests for the build_context integration function."""

    def test_build_context_structure(self, db: Session) -> None:
        """Test that build_context returns the expected keys and combined data."""
        requirement = RequirementFactory.create()
        # Add one of each to ensure non-empty strings
        ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="Global-1",
            is_global_rule=True,
            text_en="Global Rule",
        )
        p_req = ProvisionFactory.create(
            legislation=requirement.legislation,
            citation="Req-1",
            text_en="Core Requirement",
        )
        requirement.provisions.append(p_req)
        label_data = LabelDataFactory.create(brand_name={"en": "TestBrand"})
        label = label_data.label

        db.flush()
        db.refresh(requirement.legislation)
        db.refresh(requirement)

        context = build_context(label, requirement)
        assert "dictionary" in context
        assert "global_exemptions" in context
        assert "- Global-1: Global Rule" in context["global_exemptions"]
        assert "exemptions" in context
        assert "applicability_conditions" in context
        assert "provisions" in context
        assert "Core Requirement" in context["provisions"]
        assert "label_data" in context
        assert "TestBrand" in context["label_data"]


class TestRenderPrompt:
    """Tests for the render_prompt helper function."""

    def test_render_prompt_basic(self) -> None:
        """Test that the prompt is rendered with context values."""
        context = {
            "dictionary": "DEF: TEST",
            "global_exemptions": "GLOBAL: NONE",
            "exemptions": "EXEMPT: NONE",
            "applicability_conditions": "COND: NONE",
            "provisions": "PROV: TEST",
            "label_data": '{"brand": "TEST"}',
        }
        prompt = render_prompt(context)
        # Check for headers to ensure template is used
        assert "# Compliance Verification" in prompt
        assert "## Dictionary" in prompt
        assert "DEF: TEST" in prompt
        assert "PROV: TEST" in prompt
        # Check the actual content of label_data
        assert '{"brand": "TEST"}' in prompt
