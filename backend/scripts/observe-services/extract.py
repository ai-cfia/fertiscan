"""Run extraction on label images, write extraction.json and report.md."""

import argparse
import asyncio
import mimetypes
import sys
import time
from pathlib import Path

import instructor
from openai import AsyncAzureOpenAI

from app.config import settings
from app.schemas.label_data import ExtractFertilizerFieldsOutput
from app.services.label_data_extraction import ImageData, extract_fields_from_images

EXTRACTION_PROMPT = (
    "Extract fertilizer label information from these label images exactly as written."
)
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}

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


def load_images(images_dir: Path) -> list[tuple[Path, ImageData]]:
    paths = sorted(
        p
        for p in images_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )
    if not paths:
        raise SystemExit(f"No images in {images_dir}")
    result: list[tuple[Path, ImageData]] = []
    for p in paths:
        content_type = mimetypes.guess_type(str(p))[0] or "image/png"
        result.append((p, ImageData(bytes=p.read_bytes(), content_type=content_type)))
    return result


def _append_images_section(
    output_path: Path, image_paths: list[Path], lines: list[str]
) -> None:
    lines.append("## Images")
    lines.append("")
    output_parent = output_path.parent.resolve()
    for p in image_paths:
        p_res = p.resolve()
        try:
            rel = p_res.relative_to(output_parent)
        except ValueError:
            try:
                rel = Path("..") / p_res.relative_to(output_parent.parent)
            except ValueError:
                try:
                    rel = Path("../..") / p_res.relative_to(output_parent.parent.parent)
                except ValueError:
                    rel = p
        lines.append(f"![{p.name}]({rel})")
        lines.append("")
    lines.append("")


def _append_extraction_section(
    result: ExtractFertilizerFieldsOutput,
    completion: object | None,
    elapsed: float,
    lines: list[str],
) -> None:
    lines.append("## Extraction")
    lines.append("")
    lines.append("### Result")
    lines.append("```json")
    lines.append(result.model_dump_json(indent=2))
    lines.append("```")
    lines.append("")
    lines.append(f"### Usage: {format_completion(completion)} elapsed={elapsed:.1f}s")
    lines.append("")


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run extraction on label images, write extraction.json and report"
    )
    parser.add_argument(
        "images_dir",
        type=Path,
        help="Label images directory name or path (e.g. label_001)",
    )
    args = parser.parse_args()
    images_dir = resolve_path(args.images_dir)
    if not images_dir.is_dir():
        raise SystemExit(f"Not a directory: {images_dir}")
    output_dir = BASE_DIR / "output" / images_dir.name
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "report.md"
    json_path = output_dir / "extraction.json"
    lines: list[str] = []
    lines.append(f"# Observe: {images_dir.name}")
    lines.append("")
    instructor_client = get_instructor_client()
    image_tuples = load_images(images_dir)
    image_paths = [p for p, _ in image_tuples]
    images = [img for _, img in image_tuples]
    _append_images_section(output_path, image_paths, lines)
    t0 = time.perf_counter()
    result, completion = await extract_fields_from_images(
        images,
        ExtractFertilizerFieldsOutput,
        EXTRACTION_PROMPT,
        instructor_client,
    )
    elapsed = time.perf_counter() - t0
    json_path.write_text(result.model_dump_json(indent=2), encoding="utf-8")
    _append_extraction_section(result, completion, elapsed, lines)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    sys.stdout.write(
        f"Extraction usage: {format_completion(completion)} elapsed={elapsed:.1f}s\n"
    )
    sys.stdout.write(f"Wrote {output_path} {json_path}\n")


if __name__ == "__main__":
    asyncio.run(main())
