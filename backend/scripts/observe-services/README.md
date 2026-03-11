# Observe Services

Run extraction and compliance on label images, write output to markdown for
observation. Extraction and compliance are separate scripts; compliance loads
from extraction.json (you can edit it before re-running compliance).

## Prerequisites

- Azure OpenAI configured (extraction)
- DB running (compliance and --list-requirements)
- `uv run` from `backend/`

## Usage

### Extraction (from backend/)

```bash
cd backend
uv run python scripts/observe-services/extract.py label_001
```

Writes `output/label_001/report.md` and `output/label_001/extraction.json`.

### Compliance (from backend/)

Loads from `output/label_001/extraction.json`, appends results to `report.md`.
You can adjust extraction.json (fix typos, correct fields, add missing data) before
running compliance; the script uses whatever is in the file.

```bash
uv run python scripts/observe-services/compliance.py label_001 --requirement-ids <uuid1,uuid2>
```

### List requirements

```bash
uv run python scripts/observe-services/compliance.py --list-requirements
```

### Via Make

```bash
# From backend/
make observe-list-requirements          # List requirement IDs and titles
make observe-extract                   # Extraction only (label_001)
make observe-extract IMAGES_DIR=path   # Custom images dir
make observe-compliance OUTPUT_DIR=label_001 REQUIREMENT_IDS=uuid1,uuid2
make observe-full IMAGES_DIR=label_001 REQUIREMENT_IDS=uuid1,uuid2

# From repo root
make backend-observe-list-requirements
make backend-observe-extract
make backend-observe-compliance OUTPUT_DIR=label_001 REQUIREMENT_IDS=uuid1,uuid2
make backend-observe-full IMAGES_DIR=label_001 REQUIREMENT_IDS=uuid1,uuid2
```

## Output

- `output/{label}/report.md` – markdown with images, extraction summary, compliance
- `output/{label}/extraction.json` – raw extraction result; adjust as needed before
  compliance (corrections, manual edits)
- Images embedded via relative paths (preview works)
