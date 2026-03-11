"""Run compliance on extraction.json, append results to report.md."""

import argparse
import asyncio
import sys
import time
from pathlib import Path
from uuid import UUID

import instructor
from openai import AsyncAzureOpenAI
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.config import settings
from app.db.init_db import init_db
from app.db.models.fertilizer_label_data import FertilizerLabelData
from app.db.models.label import Label
from app.db.models.label_data import LabelData
from app.db.models.product_type import ProductType
from app.db.models.requirement import Requirement
from app.db.models.user import User
from app.db.session import get_sessionmaker
from app.schemas.label_data import (
    ExtractFertilizerFieldsOutput,
    FertilizerLabelDataCreate,
    LabelDataCreate,
)
from app.services.compliance import evaluate_requirement

BASE_DIR = Path(__file__).parent


def get_instructor_client() -> instructor.AsyncInstructor:
    if not settings.AZURE_OPENAI_ENDPOINT or not settings.AZURE_OPENAI_API_KEY:
        raise SystemExit(
            "Azure OpenAI not configured (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY)"
        )
    client = AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY.get_secret_value(),
        api_version=settings.AZURE_OPENAI_API_VERSION,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    )
    return instructor.from_openai(client)


def format_completion(completion: object | None) -> str:
    if completion is None:
        return "N/A"
    usage = getattr(completion, "usage", None)
    if usage is None:
        return "N/A"
    return f"prompt_tokens={usage.prompt_tokens} completion_tokens={usage.completion_tokens} total={usage.total_tokens}"


def resolve_path(path: Path) -> Path:
    if path.is_absolute():
        return path.resolve()
    return (BASE_DIR / path).resolve()


def _create_label_from_extraction(
    session: Session,
    extraction: ExtractFertilizerFieldsOutput,
    product_type_id: UUID,
    user_id: UUID,
) -> Label:
    label = Label(
        product_type_id=product_type_id,
        created_by_id=user_id,
        product_id=None,
    )
    session.add(label)
    session.flush()
    dump = extraction.model_dump(mode="json")
    label_data_create = LabelDataCreate.model_validate(dump)
    fert_data_create = FertilizerLabelDataCreate.model_validate(dump)
    label_data = LabelData(
        label_id=label.id, **label_data_create.model_dump(mode="json")
    )
    fert_data = FertilizerLabelData(
        label_id=label.id, **fert_data_create.model_dump(mode="json")
    )
    session.add(label_data)
    session.add(fert_data)
    session.flush()
    session.refresh(label)
    session.refresh(label_data)
    session.refresh(fert_data)
    return label


def list_requirements() -> None:
    sessionmaker = get_sessionmaker()
    with sessionmaker() as session:
        try:
            init_db(session)
            requirements = session.exec(
                select(Requirement).order_by(Requirement.title_en)
            ).all()
            for r in requirements:
                sys.stdout.write(f"{r.id}  {r.title_en}\n")
        finally:
            session.rollback()


async def run_compliance(
    output_dir: Path,
    requirement_ids: list[UUID],
) -> None:
    json_path = output_dir / "extraction.json"
    if not json_path.exists():
        raise SystemExit(f"extraction.json not found: {json_path}")
    extraction = ExtractFertilizerFieldsOutput.model_validate_json(
        json_path.read_text(encoding="utf-8")
    )
    report_path = output_dir / "report.md"
    existing_lines = (
        report_path.read_text(encoding="utf-8").rstrip().split("\n")
        if report_path.exists()
        else [f"# Observe: {output_dir.name}", ""]
    )
    lines = existing_lines + [""]
    instructor_client = get_instructor_client()
    sessionmaker = get_sessionmaker()
    with sessionmaker() as session:
        try:
            init_db(session)
            product_type = session.exec(
                select(ProductType).where(ProductType.code == "fertilizer")
            ).first()
            user = session.exec(
                select(User).where(User.email == settings.FIRST_SUPERUSER)
            ).first()
            if not product_type or not user:
                raise SystemExit(
                    "init_db did not create fertilizer product type or superuser"
                )
            label = _create_label_from_extraction(
                session, extraction, product_type.id, user.id
            )
            label_stmt = (
                select(Label)
                .where(Label.id == label.id)
                .options(
                    selectinload(Label.label_data),  # type: ignore[arg-type]
                    selectinload(Label.fertilizer_label_data),  # type: ignore[arg-type]
                )
            )
            loaded = session.scalars(label_stmt).first()
            if loaded is None:
                raise SystemExit("Label not found after create")
            label = loaded
            req_stmt = select(Requirement).where(Requirement.id.in_(requirement_ids))  # type: ignore[attr-defined]
            requirements = list(session.scalars(req_stmt).all())
            if len(requirements) != len(requirement_ids):
                raise SystemExit("One or more requirements not found")
            lines.append("## Compliance")
            lines.append("")
            lines.append("### Requirements analysed")
            for req in requirements:
                lines.append(f"- {req.title_en} (`{req.id}`)")
            lines.append("")
            for req in requirements:
                t0 = time.perf_counter()
                result, completion = await evaluate_requirement(
                    instructor_client, label, req
                )
                elapsed = time.perf_counter() - t0
                sys.stdout.write(
                    f"Compliance ({req.title_en}): {format_completion(completion)} elapsed={elapsed:.1f}s\n"
                )
                lines.append(f"### {req.title_en}")
                lines.append("")
                lines.append(f"- **Status**: {result.status}")
                lines.append(f"- **Explanation (en)**: {result.explanation.en or '-'}")
                lines.append(
                    f"- **Usage**: {format_completion(completion)} elapsed={elapsed:.1f}s"
                )
                lines.append("")
            report_path.write_text("\n".join(lines), encoding="utf-8")
        finally:
            session.rollback()
    sys.stdout.write(f"Wrote {report_path}\n")


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run compliance on extraction.json, append to report"
    )
    parser.add_argument(
        "output_dir",
        type=Path,
        nargs="?",
        help="Output directory (e.g. label_001) containing extraction.json",
    )
    parser.add_argument(
        "--list-requirements",
        action="store_true",
        help="List available requirements and exit",
    )
    parser.add_argument(
        "--requirement-ids",
        type=str,
        help="Comma-separated requirement UUIDs for compliance",
    )
    args = parser.parse_args()
    if args.list_requirements:
        list_requirements()
        return
    if not args.output_dir:
        parser.error("output_dir required unless --list-requirements")
    if not args.requirement_ids:
        parser.error("--requirement-ids required for compliance")
    output_dir = (
        Path(args.output_dir).resolve()
        if Path(args.output_dir).is_absolute()
        else BASE_DIR / "output" / Path(args.output_dir).name
    )
    if not output_dir.is_dir():
        raise SystemExit(f"Output directory not found: {output_dir}")
    req_ids = [UUID(s.strip()) for s in args.requirement_ids.split(",")]
    await run_compliance(output_dir, req_ids)


if __name__ == "__main__":
    asyncio.run(main())
