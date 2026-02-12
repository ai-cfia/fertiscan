"""This module contains the initial data for the rules in the database."""

from app.schemas.rule import RuleCreate

rule_data = [
    RuleCreate(
        reference_number="FzR: 16.(1)(j)",
        title_en="Lot number",
        title_fr="Numéro de lot",
        description_en="The lot number must be clearly visible on the fertilizer or supplement packaging.",
        description_fr="Le numéro de lot doit être clairement visible sur l'emballage de l'engrais ou du supplément.",
        url_en="https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._666/index.html",
        url_fr="https://laws-lois.justice.gc.ca/fra/reglements/C.R.C.%2C_ch._666/index.html",
    ),
]
