"""Database initialization utilities."""

import logging

from sqlalchemy.orm import Session

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


def init_db(session: Session) -> None:
    """Initialize database: create first superuser, product types, and compliance data."""
    # Create first superuser
    if user := session.query(User).filter_by(email=settings.FIRST_SUPERUSER).first():
        logger.info(f"Superuser already exists: {user.email}")
    else:
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

    # Seed product types
    if product_type := session.query(ProductType).filter_by(code="fertilizer").first():
        logger.info(f"ProductType 'fertilizer' already exists: {product_type.code}")
    else:
        product_type = ProductType(
            code="fertilizer",
            name_en="Fertilizer",
            name_fr="Engrais",
            is_active=True,
        )
        session.add(product_type)
        session.commit()
        logger.info(f"ProductType 'fertilizer' created: {product_type.code}")

    # Seed compliance data
    seed_data = settings.compliance_seed_data()

    # 1. UPSERT Legislations
    leg_map = {}
    for leg_data in seed_data.get("legislations", []):
        leg = (
            session.query(Legislation)
            .filter_by(citation_reference=leg_data["citation_reference"])
            .first()
        )
        if not leg:
            leg = Legislation(**leg_data)
            session.add(leg)
            session.flush()
            logger.info(f"Legislation created: {leg.citation_reference}")
        leg_map[leg.citation_reference] = leg

    # 2. UPSERT Definitions
    for def_data in seed_data.get("definitions", []):
        leg_ref = def_data.pop("legislation_citation")
        leg = leg_map.get(leg_ref)
        if not leg:
            logger.error(
                f"Legislation {leg_ref} not found for definition {def_data.get('title_en', '')}"
            )
            continue

        definition = (
            session.query(Definition)
            .filter_by(legislation_id=leg.id, title_en=def_data["title_en"])
            .first()
        )
        if not definition:
            definition = Definition(legislation_id=leg.id, **def_data)
            session.add(definition)
            session.flush()
            logger.info(f"Definition created: {definition.title_en}")
        else:
            for k, v in def_data.items():
                setattr(definition, k, v)
            session.add(definition)
            session.flush()

    # 3. UPSERT Provisions
    for prov_data in seed_data.get("provisions", []):
        leg_ref = prov_data.pop("legislation_citation")
        leg = leg_map.get(leg_ref)
        if not leg:
            logger.error(
                f"Legislation {leg_ref} not found for provision {prov_data.get('citation', '')}"
            )
            continue

        def_infos = prov_data.pop("definitions", [])

        prov = (
            session.query(Provision)
            .filter_by(legislation_id=leg.id, citation=prov_data["citation"])
            .first()
        )
        if not prov:
            prov = Provision(legislation_id=leg.id, **prov_data)
            session.add(prov)
            session.flush()
            logger.info(f"Provision created: {prov.citation}")
        else:
            for k, v in prov_data.items():
                setattr(prov, k, v)
            session.add(prov)
            session.flush()

        # Update Associations (Definitions)
        for def_info in def_infos:
            def_leg_ref = def_info["legislation"]
            term = def_info["term"]
            target_leg = leg_map.get(def_leg_ref)
            if not target_leg:
                logger.error(
                    f"Legislation {def_leg_ref} not found for definition {term}"
                )
                continue

            definition = (
                session.query(Definition)
                .filter_by(legislation_id=target_leg.id, title_en=term)
                .first()
            )
            if (
                definition
                and not session.query(ProvisionDefinition)
                .filter_by(provision_id=prov.id, definition_id=definition.id)
                .first()
            ):
                session.add(
                    ProvisionDefinition(
                        provision_id=prov.id, definition_id=definition.id
                    )
                )

    # 4. UPSERT Requirements
    for req_data in seed_data.get("requirements", []):
        rules = req_data.pop("rules", [])
        modifiers = req_data.pop("modifiers", [])

        # Resolve primary legislation from first rule
        if not rules:
            logger.warning(
                f"Requirement {req_data.get('title_en', 'Unknown')} has no rules. Skipping."
            )
            continue

        primary_leg_ref = rules[0]["legislation"]
        primary_leg = leg_map.get(primary_leg_ref)
        if not primary_leg:
            logger.error(
                f"Primary legislation {primary_leg_ref} not found for requirement {req_data.get('title_en', 'Unknown')}"
            )
            continue

        req = (
            session.query(Requirement).filter_by(title_en=req_data["title_en"]).first()
        )
        if not req:
            req = Requirement(legislation_id=primary_leg.id, **req_data)
            session.add(req)
            session.flush()
            logger.info(f"Requirement created: {req.title_en}")
        else:
            if req.legislation_id != primary_leg.id:
                req.legislation_id = primary_leg.id
            for k, v in req_data.items():
                setattr(req, k, v)
            session.add(req)
            session.flush()

        # Update Associations (Rules)
        for rule_info in rules:
            leg_ref = rule_info["legislation"]
            citation = rule_info["citation"]
            target_leg = leg_map.get(leg_ref)
            if not target_leg:
                continue

            prov = (
                session.query(Provision)
                .filter_by(legislation_id=target_leg.id, citation=citation)
                .first()
            )
            if (
                prov
                and not session.query(RequirementProvision)
                .filter_by(requirement_id=req.id, provision_id=prov.id)
                .first()
            ):
                session.add(
                    RequirementProvision(requirement_id=req.id, provision_id=prov.id)
                )

        # Update Associations (Modifiers)
        for mod_info in modifiers:
            leg_ref = mod_info["legislation"]
            citation = mod_info["citation"]
            mod_type = mod_info["type"]
            target_leg = leg_map.get(leg_ref)
            if not target_leg:
                continue

            prov = (
                session.query(Provision)
                .filter_by(legislation_id=target_leg.id, citation=citation)
                .first()
            )
            if (
                prov
                and not session.query(RequirementModifier)
                .filter_by(
                    requirement_id=req.id,
                    provision_id=prov.id,
                    type=ModifierType(mod_type),
                )
                .first()
            ):
                session.add(
                    RequirementModifier(
                        requirement_id=req.id,
                        provision_id=prov.id,
                        type=ModifierType(mod_type),
                    )
                )

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
