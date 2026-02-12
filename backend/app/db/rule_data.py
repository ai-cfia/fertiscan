"""This module contains the initial data for the rules in the database."""

from __future__ import annotations

import json
from pathlib import Path

from app.schemas.rule import RuleCreate

_DATA_PATH = Path(__file__).parent / "data" / "rule_data.json"

_raw_rules = []
if _DATA_PATH.exists():
    with _DATA_PATH.open("r", encoding="utf-8") as data_file:
        _raw_rules = json.load(data_file)

rule_data = [RuleCreate(**rule) for rule in _raw_rules]
