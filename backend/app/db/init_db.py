"""Database initialization utilities."""

import logging
import re
from typing import Any
from uuid import UUID

from sqlmodel import Session, select

from app.config import settings
from app.core.security import get_password_hash
from app.db.models import (
    Definition,
    Legislation,
    ModifierType,
    ProductType,
    Provision,
    ProvisionDefinition,
    Requirement,
    RequirementModifier,
    RequirementProvision,
    User,
)
from app.db.session import get_sessionmaker

logger = logging.getLogger(__name__)

# --- Seed data keys ---
SEED_LEGISLATIONS = "legislations"
SEED_DEFINITIONS = "definitions"
SEED_PROVISIONS = "provisions"
SEED_REQUIREMENTS = "requirements"
KEY_PRODUCT_TYPE = "product_type"
KEY_LEGISLATION_CITATION = "legislation_citation"
KEY_CITATION_REF = "citation_reference"
KEY_CITATION = "citation"
KEY_TITLE_EN = "title_en"
KEY_LEGISLATION = "legislation"
KEY_TERM = "term"
KEY_TYPE = "type"
KEY_RULES = "rules"
KEY_MODIFIERS = "modifiers"
KEY_DEFINITIONS = "definitions"


# ============================== Seed functions ==============================


def _seed_superuser(session: Session) -> None:
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if user:
        logger.info(f"Superuser already exists: {user.email}")
        return
    user = User(
        email=settings.FIRST_SUPERUSER,
        hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
        is_superuser=True,
        first_name="Admin",
        last_name="User",
    )
    session.add(user)
    session.commit()
    logger.info(f"Superuser created: {user.email}")


def _seed_product_types(session: Session) -> None:
    pt = session.exec(
        select(ProductType).where(ProductType.code == "fertilizer")
    ).first()
    if pt:
        logger.info(f"ProductType 'fertilizer' already exists: {pt.code}")
        return
    pt = ProductType(
        code="fertilizer",
        name_en="Fertilizer",
        name_fr="Engrais",
        is_active=True,
    )
    session.add(pt)
    session.commit()
    logger.info(f"ProductType 'fertilizer' created: {pt.code}")


def _seed_legislations(
    session: Session, seed_data: dict[str, Any]
) -> dict[str, Legislation]:
    leg_map: dict[str, Legislation] = {}
    product_type_map: dict[str, ProductType] = {
        pt.code: pt for pt in session.exec(select(ProductType)).all() if pt.code
    }
    for leg_data in seed_data.get(SEED_LEGISLATIONS, []):
        product_type_code = leg_data.get(KEY_PRODUCT_TYPE)
        if not product_type_code:
            logger.error(
                f"Legislation {leg_data.get(KEY_CITATION_REF, '')} missing product_type. Skipping."
            )
            continue
        pt = product_type_map.get(product_type_code)
        if not pt:
            logger.error(
                f"ProductType '{product_type_code}' not found for legislation {leg_data.get(KEY_CITATION_REF, '')}. Skipping."
            )
            continue
        model_data = {k: v for k, v in leg_data.items() if k != KEY_PRODUCT_TYPE}
        leg = session.exec(
            select(Legislation).where(
                Legislation.citation_reference == leg_data[KEY_CITATION_REF]
            )
        ).first()
        if not leg:
            leg = Legislation(product_type_id=pt.id, **model_data)
            session.add(leg)
            session.flush()
            logger.info(f"Legislation created: {leg.citation_reference}")
        else:
            leg.product_type_id = pt.id
            for k, v in model_data.items():
                if hasattr(leg, k):
                    setattr(leg, k, v)
            session.add(leg)
            session.flush()
        leg_map[leg.citation_reference] = leg
    return leg_map


def _seed_definitions(
    session: Session,
    seed_data: dict[str, Any],
    leg_map: dict[str, Legislation],
) -> None:
    for def_data in seed_data.get(SEED_DEFINITIONS, []):
        leg_ref = def_data.get(KEY_LEGISLATION_CITATION)
        leg = leg_map.get(leg_ref)
        if not leg:
            logger.error(
                f"Legislation {leg_ref} not found for definition {def_data.get(KEY_TITLE_EN, '')}"
            )
            continue
        model_data = {
            k: v for k, v in def_data.items() if k != KEY_LEGISLATION_CITATION
        }
        definition = session.exec(
            select(Definition).where(
                Definition.legislation_id == leg.id,
                Definition.title_en == def_data[KEY_TITLE_EN],
            )
        ).first()
        if not definition:
            definition = Definition(legislation_id=leg.id, **model_data)
            session.add(definition)
            session.flush()
            logger.info(f"Definition created: {definition.title_en}")
        else:
            for k, v in model_data.items():
                setattr(definition, k, v)
            session.add(definition)
            session.flush()


CITATION_RE = re.compile(r"^([\d.]+)(?:\(([\d.]+)\))?(?:\(([^)]+)\))?$")

# Canonical AKN URI bases — extend as new legislation is added
AKN_URI_MAP = {
    "C.R.C., c. 666": "/akn/ca/reg/fertilizers-regulations",
    "C.R.C., c. 296": "/akn/ca/reg/feeds-regulations",
    "R.S.C., 1985, c. F-10": "/akn/ca/act/fertilizers-act",
}

def _get_or_create_provision(
    session: Session,
    legislation_id: UUID,
    section: str,
    subsection: str | None,
    paragraph: str | None,
    akn_base: str | None,
    extra: dict[str, Any] | None = None,
) -> Provision:
    prov = session.exec(
        select(Provision).where(
            Provision.legislation_id == legislation_id,
            Provision.section == section,
            Provision.subsection == subsection,
            Provision.paragraph == paragraph,
        )
    ).first()

    if not prov:
        akn_uri = _build_akn_uri(akn_base, section, subsection, paragraph) if akn_base else None
        data = {
            "legislation_id": legislation_id,
            "section": section,
            "subsection": subsection,
            "paragraph": paragraph,
            "akn_uri": akn_uri,
            "is_current": True,
            **(extra or {}),
        }
        prov = Provision(**data)
        session.add(prov)
        session.flush()
        logger.info(f"Provision created: {prov.citation} (phantom={extra is None})")
    elif extra:
        for k, v in extra.items():
            if k == "akn_uri" and prov.akn_uri is not None:
                continue
            setattr(prov, k, v)
        session.add(prov)
        session.flush()

    return prov

def _parse_citation(citation: str) -> tuple[str, str | None, str | None]:
    m = CITATION_RE.match(citation)
    if not m:
        raise ValueError(f"Unrecognized citation format: {citation!r}")
    section, subsection, paragraph = m.groups()
    return section, subsection, paragraph


def _build_akn_uri(akn_base: str, section: str, subsection: str | None, paragraph: str | None) -> str:
    uri = f"{akn_base}/section/{section}"
    if subsection:
        uri += f"/subsection/{subsection}"
    if paragraph:
        uri += f"/paragraph/{paragraph}"
    return uri

def _seed_provisions(
    session: Session,
    seed_data: dict[str, Any],
    leg_map: dict[str, Legislation],
) -> None:
    provisions_data = seed_data.get(SEED_PROVISIONS, [])

    # Sort by depth so parents are always created before children
    def _depth(citation: str) -> int:
        m = CITATION_RE.match(citation)
        if not m:
            return 1
        _, sub, par = m.groups()
        if par:
            return 3
        if sub:
            return 2
        return 1

    sorted_provisions = sorted(
        provisions_data,
        key=lambda p: _depth(p.get(KEY_CITATION, ""))
    )

    for prov_data in sorted_provisions:
        leg_ref = prov_data.get(KEY_LEGISLATION_CITATION)
        raw_citation = prov_data.get(KEY_CITATION, "")
        logger.info(f"Processing provision: {raw_citation}")

        leg = leg_map.get(leg_ref)
        if not leg:
            logger.error(f"Legislation {leg_ref} not found for provision {raw_citation}")
            continue

        try:
            section, subsection, paragraph = _parse_citation(raw_citation)
        except ValueError as e:
            logger.error(str(e))
            continue

        akn_base = AKN_URI_MAP.get(leg_ref)
        def_infos = prov_data.get(KEY_DEFINITIONS, [])
        extra = {
            k: v
            for k, v in prov_data.items()
            if k not in (KEY_LEGISLATION_CITATION, KEY_DEFINITIONS, KEY_CITATION)
        }
        extra |= {"section": section, "subsection": subsection, "paragraph": paragraph}

        # Synthesize phantom parents if they don't exist yet
        section_row: Provision | None = None
        subsection_row: Provision | None = None

        # Always ensure section row exists
        section_row = _get_or_create_provision(
            session, leg.id, section, None, None, akn_base
        )

        # Ensure subsection row exists if this provision has a subsection
        if subsection:
            subsection_row = _get_or_create_provision(
                session, leg.id, section, subsection, None, akn_base
            )
            subsection_row.parent_id = section_row.id
            session.add(subsection_row)
            session.flush()

        # Resolve parent_id for the actual provision
        if paragraph:
            parent_id = subsection_row.id if subsection_row else None
        elif subsection:
            parent_id = section_row.id
        else:
            parent_id = None

        # Create or update the actual provision
        extra["parent_id"] = parent_id
        prov = _get_or_create_provision(
            session, leg.id, section, subsection, paragraph, akn_base, extra
        )

        # Link definitions
        for def_info in def_infos:
            def_leg_ref = def_info[KEY_LEGISLATION]
            term = def_info[KEY_TERM]
            target_leg = leg_map.get(def_leg_ref)
            if not target_leg:
                logger.error(f"Legislation {def_leg_ref} not found for definition {term}")
                continue

            definition = session.exec(
                select(Definition).where(
                    Definition.legislation_id == target_leg.id,
                    Definition.title_en == term,
                )
            ).first()
            if not definition:
                continue

            exists = session.exec(
                select(ProvisionDefinition).where(
                    ProvisionDefinition.provision_id == prov.id,
                    ProvisionDefinition.definition_id == definition.id,
                )
            ).first()
            if not exists:
                session.add(ProvisionDefinition(provision_id=prov.id, definition_id=definition.id))

def _seed_requirements(
    session: Session,
    seed_data: dict[str, Any],
    leg_map: dict[str, Legislation],
) -> None:
    for req_data in seed_data.get(SEED_REQUIREMENTS, []):
        rules = req_data.get(KEY_RULES, [])
        modifiers = req_data.get(KEY_MODIFIERS, [])
        if not rules:
            logger.warning(
                f"Requirement {req_data.get(KEY_TITLE_EN, 'Unknown')} has no rules. Skipping."
            )
            continue
        primary_leg_ref = rules[0][KEY_LEGISLATION]
        primary_leg = leg_map.get(primary_leg_ref)
        if not primary_leg:
            logger.error(
                f"Primary legislation {primary_leg_ref} not found for requirement {req_data.get(KEY_TITLE_EN, 'Unknown')}"
            )
            continue
        model_data = {
            k: v for k, v in req_data.items() if k not in (KEY_RULES, KEY_MODIFIERS)
        }
        req = session.exec(
            select(Requirement).where(Requirement.title_en == req_data[KEY_TITLE_EN])
        ).first()
        if not req:
            req = Requirement(legislation_id=primary_leg.id, **model_data)
            session.add(req)
            session.flush()
            logger.info(f"Requirement created: {req.title_en}")
        else:
            req.legislation_id = primary_leg.id
            for k, v in model_data.items():
                setattr(req, k, v)
            session.add(req)
            session.flush()
        for rule_info in rules:
            target_leg = leg_map.get(rule_info[KEY_LEGISLATION])
            if not target_leg:
                continue
            prov = session.exec(
                select(Provision).where(
                    Provision.legislation_id == target_leg.id,
                    Provision.citation == rule_info[KEY_CITATION],
                )
            ).first()
            if (
                prov
                and not session.exec(
                    select(RequirementProvision).where(
                        RequirementProvision.requirement_id == req.id,
                        RequirementProvision.provision_id == prov.id,
                    )
                ).first()
            ):
                session.add(
                    RequirementProvision(requirement_id=req.id, provision_id=prov.id)
                )
        for mod_info in modifiers:
            target_leg = leg_map.get(mod_info[KEY_LEGISLATION])
            if not target_leg:
                continue
            prov = session.exec(
                select(Provision).where(
                    Provision.legislation_id == target_leg.id,
                    Provision.citation == mod_info[KEY_CITATION],
                )
            ).first()
            if (
                prov
                and not session.exec(
                    select(RequirementModifier).where(
                        RequirementModifier.requirement_id == req.id,
                        RequirementModifier.provision_id == prov.id,
                        RequirementModifier.type == ModifierType(mod_info[KEY_TYPE]),
                    )
                ).first()
            ):
                session.add(
                    RequirementModifier(
                        requirement_id=req.id,
                        provision_id=prov.id,
                        type=ModifierType(mod_info[KEY_TYPE]),
                    )
                )


# ============================== Public API ==============================


def init_db(session: Session) -> None:
    """Initialize database: create first superuser, product types, and compliance data."""
    _seed_superuser(session)
    _seed_product_types(session)
    seed_data = settings.compliance_seed_data()
    legislation_map = _seed_legislations(session, seed_data)
    _seed_definitions(session, seed_data, legislation_map)
    _seed_provisions(session, seed_data, legislation_map)
    _seed_requirements(session, seed_data, legislation_map)
    session.commit()
    logger.info("Compliance seed data applied successfully")


def run(session: Session | None = None) -> None:
    """Run database initialization with optional session."""
    logger.info("Initializing database")
    if session:
        init_db(session)
    else:
        with get_sessionmaker()() as s:
            init_db(s)
    logger.info("Database initialized")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
