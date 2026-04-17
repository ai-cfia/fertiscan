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

0. We create two mock of a realistic label for this benchmark. The mock need to
   contain at least one example of each case (compliant, non-compliant, etc.). So,
   the label evaluated by a human to choose the best.
1. The compliance status is already known from step 0, this step
   only requires parsing the evaluation results into a JSON file, which serves as
   the ground truth for compliance.

   - The pre script will create 3 others same fields with some difference to
   have every possible case.
      1. It's the original one who are compliant.
      2. It's the first copy which is empty.
      3. The second copy, []
      4. The third copy, []
   - Establish the ground truth of each version in a separated JSON file. Each
   ground truth need to be associated with a requirement like the name of the
   requirement number.

2. We ask the LLM to evaluate the label and output the results in a JSON file.
   A script then compares each case in the LLM output with the ground truth,
   assigning a score of 1 (correct) or 0 (incorrect). Finally, the script
   generates a benchmark report with the overall score.

   - Before executing the main part of the script, he will verify if we have the
   two ground truth in the underlying folder and all field is complete. If the
   two ground truth is here continue the script.
   - It must also check if the mock is present and all variant of each field are
   present for the LLM evaluation.
   - The script search all requirement and write on the result file the number of
   requirement. In addition, the script use the requirement file in the data folder.
   - The first step is isolate each field of the mock label for the evaluation
   by the LLM and that it be atomic.
   - The second step it's launch the LLM to evaluate each requirement with the
   the several version of each field like registration number : with a registration
   number, no registration number, etc.
   - []

## Need

1. In each json he need a schema like for the json of ground truth extraction,
he use the schema of extraction and for the ground truth of evaluate he use the
schema of the evaluation to do it.
