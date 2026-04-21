# Benchmark Design

This document describes the benchmark approach used to evaluate extraction and
compliance quality in FertiScan.

## Goals

1. Measure model quality with reproducible fixture data.
2. Compare LLM output against curated ground truth.
3. Produce a report that is easy to interpret and share.

## Extraction Benchmark

### Workflow

1. Build fixture inputs (label images).
2. Create a JSON ground truth file with expected extracted values.
3. Run extraction with the LLM.
4. Compare predicted values against the ground truth.
5. Report per-field score and overall score.

### Expected output

1. Per-field comparison.
2. Aggregated extraction accuracy.

## Compliance Benchmark

### Inputs

1. Label fixtures in backend/app/benchmark/compliance/data.
2. One matching ground truth file per label fixture in
   backend/app/benchmark/compliance/ground_truth.
3. Requirement catalog loaded from the database.

### Prescript validation

Before running the benchmark, prescript validates:

1. Label fixture files exist and contain valid JSON.
2. Label fixtures match the ExtractFertilizerFieldsOutput schema.
3. Ground truth files exist for each label fixture.
4. Ground truth entries include:
   - label_file matching the filename.
   - requirement_ref with citation and title_en.
   - expected_status with a valid compliance status.
5. Status aliases are normalized to canonical values.

### Evaluation workflow

1. Build transient Label objects from fixture files.
2. Load all benchmark requirements from the database.
3. Evaluate each requirement independently for each label.
4. Persist each atomic result to a JSONL file.
5. Compare predicted status with expected status when available.

### Reporting

The benchmark report includes:

1. Run metadata (run id, file paths, counts).
2. Global metrics:
   - total evaluations,
   - comparable evaluations,
   - successful matches,
   - failures,
   - global accuracy.
3. Accuracy tables by label and by requirement.
4. Status coverage for expected and predicted statuses.

## Known Limitations

1. Results depend on fixture quality and coverage.
2. Requirement interpretation can still vary for ambiguous cases.
3. Benchmark quality improves as fixture and ground truth diversity increases.
