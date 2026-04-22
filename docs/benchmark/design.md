# Benchmark Design

This document describes the benchmark approach used to evaluate extraction and
compliance quality in FertiScan.

## Goals

1. Measure model quality with reproducible fixture data.
2. Compare LLM output against curated ground truth.
3. Produce a report that is easy to interpret and share.

## Extraction Benchmark

### Inputs

1. Label images in backend/app/benchmark/extraction/data.
2. One matching ground truth file per label images in
   backend/app/benchmark/extraction/ground_truth.

### Prescript validation

Before running the benchmark, prescript validates:

1. Label image files and contain a valid extension for image.
2. Ground truth files exist for each label image.
3. Ground truth entries include:
   - label_file matching the filename.
   - Each field in a label extract is populated based on the label image.
   - It's a JSON file.

### Extraction workflow

1. Launch LLM to extract each information independently of each label image.
2. Persist each atomic result to a JSONL file.
3. Convert the informmation to the labels objects to the comparison.
4. Normalize the labels object fields.
5. Build transient Label objects from the ground truth files.
6. Compare predicted label information with expected label information when available.
   - Each field of the label need to be compare with a similitude per cent.
   - Each word is compared with the corresponding field in them ground truth file.
   - The percentage must be 90% or higher to pass.

## Reporting

The benchmark report includes:

1. Run metadata (run id, file paths, counts).
2. Global metrics:
   - total extractions,
   - comparable extractions (),
   - successful matches,
   - failures,
   - global accuracy.
3. Accuracy tables by label
4. Field coverage for expected and predicted statuses.

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
