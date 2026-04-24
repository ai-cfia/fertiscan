# Compliance Benchmark Results

Run ID: compliance_benchmark_run

Atomic results file: compliance_benchmark_run.jsonl

Number of requirements in database: 11
Number of label files: 7
Total atomic evaluations: 77
Comparable evaluations: 77
Successful matches: 31
Evaluation failures: 0
Global accuracy: 40.26%

## Outcome summary

| Outcome | Count |
| --- | ---: |
| match | 31 |
| mismatch | 46 |
| not_comparable | 0 |
| error | 0 |

## Accuracy by label

| Label | Comparable | Matches | Accuracy |
| --- | ---: | ---: | ---: |
| label1.json | 11 | 9 | 81.82% |
| label2.json | 11 | 7 | 63.64% |
| label3.json | 11 | 2 | 18.18% |
| label4.json | 11 | 2 | 18.18% |
| label5.json | 11 | 9 | 81.82% |
| label6.json | 11 | 2 | 18.18% |
| label7.json | 11 | 0 | 0.00% |

## Accuracy by requirement

| Requirement | Comparable | Matches | Accuracy |
| --- | ---: | ---: | ---: |
| 16(1)(a) | 7 | 2 | 28.57% |
| 16(1)(b) | 7 | 2 | 28.57% |
| 16(1)(c) | 7 | 6 | 85.71% |
| 16(1)(d) | 7 | 0 | 0.00% |
| 16(1)(e) | 7 | 3 | 42.86% |
| 16(1)(f) | 7 | 3 | 42.86% |
| 16(1)(g) | 7 | 3 | 42.86% |
| 16(1)(h) | 7 | 3 | 42.86% |
| 16(1)(i) | 7 | 6 | 85.71% |
| 16(1)(j) | 7 | 3 | 42.86% |
| 16(1)(k) | 7 | 0 | 0.00% |

## Status coverage

### Ground truth expected statuses

| Status | Count |
| --- | ---: |
| compliant | 43 |
| inconclusive | 1 |
| non_compliant | 19 |
| not_applicable | 14 |

### LLM predicted statuses

| Status | Count |
| --- | ---: |
| compliant | 18 |
| non_compliant | 11 |
| not_applicable | 48 |

## Comparison log (mismatch + error)

| Label | Requirement | Expected | Predicted | Outcome | Duration (ms) | Error |
| --- | --- | --- | --- | --- | ---: | --- |
| label1.json | 16(1)(k) | not_applicable | compliant | mismatch | 811 | None |
| label1.json | 16(1)(d) | not_applicable | compliant | mismatch | 740 | None |
| label2.json | 16(1)(k) | non_compliant | not_applicable | mismatch | 804 | None |
| label2.json | 16(1)(b) | compliant | non_compliant | mismatch | 758 | None |
| label2.json | 16(1)(a) | compliant | non_compliant | mismatch | 857 | None |
| label2.json | 16(1)(d) | non_compliant | not_applicable | mismatch | 744 | None |
| label3.json | 16(1)(f) | compliant | not_applicable | mismatch | 978 | None |
| label3.json | 16(1)(e) | compliant | not_applicable | mismatch | 833 | None |
| label3.json | 16(1)(k) | non_compliant | not_applicable | mismatch | 875 | None |
| label3.json | 16(1)(g) | non_compliant | not_applicable | mismatch | 918 | None |
| label3.json | 16(1)(j) | compliant | not_applicable | mismatch | 932 | None |
| label3.json | 16(1)(b) | compliant | not_applicable | mismatch | 1001 | None |
| label3.json | 16(1)(a) | compliant | not_applicable | mismatch | 957 | None |
| label3.json | 16(1)(h) | compliant | not_applicable | mismatch | 926 | None |
| label3.json | 16(1)(d) | non_compliant | not_applicable | mismatch | 870 | None |
| label4.json | 16(1)(f) | compliant | not_applicable | mismatch | 866 | None |
| label4.json | 16(1)(e) | compliant | not_applicable | mismatch | 928 | None |
| label4.json | 16(1)(k) | compliant | not_applicable | mismatch | 848 | None |
| label4.json | 16(1)(g) | non_compliant | not_applicable | mismatch | 992 | None |
| label4.json | 16(1)(j) | compliant | not_applicable | mismatch | 1126 | None |
| label4.json | 16(1)(b) | compliant | not_applicable | mismatch | 847 | None |
| label4.json | 16(1)(a) | compliant | not_applicable | mismatch | 1131 | None |
| label4.json | 16(1)(h) | compliant | not_applicable | mismatch | 1140 | None |
| label4.json | 16(1)(d) | non_compliant | not_applicable | mismatch | 1137 | None |
| label5.json | 16(1)(k) | not_applicable | compliant | mismatch | 1132 | None |
| label5.json | 16(1)(d) | not_applicable | compliant | mismatch | 1137 | None |
| label6.json | 16(1)(f) | compliant | not_applicable | mismatch | 1130 | None |
| label6.json | 16(1)(e) | compliant | not_applicable | mismatch | 1138 | None |
| label6.json | 16(1)(k) | compliant | not_applicable | mismatch | 1131 | None |
| label6.json | 16(1)(g) | non_compliant | not_applicable | mismatch | 1123 | None |
| label6.json | 16(1)(j) | compliant | not_applicable | mismatch | 1133 | None |
| label6.json | 16(1)(b) | compliant | not_applicable | mismatch | 1127 | None |
| label6.json | 16(1)(a) | compliant | not_applicable | mismatch | 1128 | None |
| label6.json | 16(1)(h) | compliant | not_applicable | mismatch | 1192 | None |
| label6.json | 16(1)(d) | compliant | not_applicable | mismatch | 1131 | None |
| label7.json | 16(1)(f) | compliant | not_applicable | mismatch | 1132 | None |
| label7.json | 16(1)(e) | compliant | not_applicable | mismatch | 1137 | None |
| label7.json | 16(1)(k) | non_compliant | not_applicable | mismatch | 1137 | None |
| label7.json | 16(1)(i) | inconclusive | not_applicable | mismatch | 1131 | None |
| label7.json | 16(1)(g) | non_compliant | not_applicable | mismatch | 1133 | None |
| label7.json | 16(1)(j) | compliant | not_applicable | mismatch | 1128 | None |
| label7.json | 16(1)(b) | compliant | not_applicable | mismatch | 1128 | None |
| label7.json | 16(1)(c) | not_applicable | non_compliant | mismatch | 1112 | None |
| label7.json | 16(1)(a) | compliant | not_applicable | mismatch | 1127 | None |
| label7.json | 16(1)(h) | compliant | not_applicable | mismatch | 1157 | None |
| label7.json | 16(1)(d) | non_compliant | not_applicable | mismatch | 1127 | None |
