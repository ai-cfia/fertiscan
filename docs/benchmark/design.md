# Design for benchmark the system

## Extraction benchmark

1. We manually extract one or more label images and store the results in a
   JSON file to define what a correct extraction looks like. This JSON file serves
   as the ground truth for the extraction task.
2. We then ask the LLM to extract the information from the label images.
   Afterward, a script compares the LLM’s output with the ground truth. Each field
   is evaluated with a percentage score, and a final global score is produced at
   the end of the benchmark.

## Compliance benchmark

0. We create a mock of a realistic label for this benchmark. The mock need to
   contain at least one example of each case (compliant, non-compliant, etc.). So,
   the label evaluated by a human to choose the best.
1. The compliance status is already known from step 0, this step
   only requires parsing the evaluation results into a JSON file, which serves as
   the ground truth for compliance.
2. We ask the LLM to evaluate the label and output the results in a JSON file.
   A script then compares each case in the LLM output with the ground truth,
   assigning a score of 1 (correct) or 0 (incorrect). Finally, the script
   generates a benchmark report with the overall score.

## Need

1. In each json he need a schema like for the json of ground truth extraction,
he use the schema of extraction and for the ground truth of evaluate he use the
schema of the evaluation to do it.
