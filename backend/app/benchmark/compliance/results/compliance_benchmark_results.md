# Compliance Benchmark Results

Run ID: compliance_benchmark_run

Atomic results file: compliance_benchmark_run.jsonl

Number of requirements in database: 11
Number of label files: 7
Total atomic evaluations: 77
Comparable evaluations: 77
Successful matches: 32
Evaluation failures: 0
Global accuracy: 41.56%

## Outcome summary

| Outcome | Count |
| --- | ---: |
| match | 32 |
| mismatch | 45 |
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
| label7.json | 11 | 1 | 9.09% |

## Accuracy by requirement

| Requirement | Comparable | Matches | Accuracy |
| --- | ---: | ---: | ---: |
| 16(1)(a) | 7 | 2 | 28.57% |
| 16(1)(b) | 7 | 2 | 28.57% |
| 16(1)(c) | 7 | 7 | 100.00% |
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
| non_compliant | 10 |
| not_applicable | 49 |

## Comparison log (mismatch + error)

| Label | Requirement | Expected | Predicted | Outcome | Duration (ms) | Error |
| --- | --- | --- | --- | --- | ---: | --- |
| label1.json | 16(1)(k) | not_applicable | compliant | mismatch | 830 | None |
| label1.json | 16(1)(d) | not_applicable | compliant | mismatch | 832 | None |
| label2.json | 16(1)(k) | non_compliant | not_applicable | mismatch | 786 | None |
| label2.json | 16(1)(b) | compliant | non_compliant | mismatch | 741 | None |
| label2.json | 16(1)(a) | compliant | non_compliant | mismatch | 898 | None |
| label2.json | 16(1)(d) | non_compliant | not_applicable | mismatch | 777 | None |
| label3.json | 16(1)(f) | compliant | not_applicable | mismatch | 939 | None |
| label3.json | 16(1)(e) | compliant | not_applicable | mismatch | 809 | None |
| label3.json | 16(1)(k) | non_compliant | not_applicable | mismatch | 989 | None |
| label3.json | 16(1)(g) | non_compliant | not_applicable | mismatch | 873 | None |
| label3.json | 16(1)(j) | compliant | not_applicable | mismatch | 757 | None |
| label3.json | 16(1)(b) | compliant | not_applicable | mismatch | 896 | None |
| label3.json | 16(1)(a) | compliant | not_applicable | mismatch | 1006 | None |
| label3.json | 16(1)(h) | compliant | not_applicable | mismatch | 989 | None |
| label3.json | 16(1)(d) | non_compliant | not_applicable | mismatch | 940 | None |
| label4.json | 16(1)(f) | compliant | not_applicable | mismatch | 867 | None |
| label4.json | 16(1)(e) | compliant | not_applicable | mismatch | 992 | None |
| label4.json | 16(1)(k) | compliant | not_applicable | mismatch | 873 | None |
| label4.json | 16(1)(g) | non_compliant | not_applicable | mismatch | 932 | None |
| label4.json | 16(1)(j) | compliant | not_applicable | mismatch | 978 | None |
| label4.json | 16(1)(b) | compliant | not_applicable | mismatch | 834 | None |
| label4.json | 16(1)(a) | compliant | not_applicable | mismatch | 829 | None |
| label4.json | 16(1)(h) | compliant | not_applicable | mismatch | 1018 | None |
| label4.json | 16(1)(d) | non_compliant | not_applicable | mismatch | 1045 | None |
| label5.json | 16(1)(k) | not_applicable | compliant | mismatch | 1055 | None |
| label5.json | 16(1)(d) | not_applicable | compliant | mismatch | 837 | None |
| label6.json | 16(1)(f) | compliant | not_applicable | mismatch | 795 | None |
| label6.json | 16(1)(e) | compliant | not_applicable | mismatch | 1108 | None |
| label6.json | 16(1)(k) | compliant | not_applicable | mismatch | 1054 | None |
| label6.json | 16(1)(g) | non_compliant | not_applicable | mismatch | 1004 | None |
| label6.json | 16(1)(j) | compliant | not_applicable | mismatch | 991 | None |
| label6.json | 16(1)(b) | compliant | not_applicable | mismatch | 826 | None |
| label6.json | 16(1)(a) | compliant | not_applicable | mismatch | 1080 | None |
| label6.json | 16(1)(h) | compliant | not_applicable | mismatch | 996 | None |
| label6.json | 16(1)(d) | compliant | not_applicable | mismatch | 1158 | None |
| label7.json | 16(1)(f) | compliant | not_applicable | mismatch | 1052 | None |
| label7.json | 16(1)(e) | compliant | not_applicable | mismatch | 881 | None |
| label7.json | 16(1)(k) | non_compliant | not_applicable | mismatch | 897 | None |
| label7.json | 16(1)(i) | inconclusive | not_applicable | mismatch | 944 | None |
| label7.json | 16(1)(g) | non_compliant | not_applicable | mismatch | 1397 | None |
| label7.json | 16(1)(j) | compliant | not_applicable | mismatch | 936 | None |
| label7.json | 16(1)(b) | compliant | not_applicable | mismatch | 1035 | None |
| label7.json | 16(1)(a) | compliant | not_applicable | mismatch | 1007 | None |
| label7.json | 16(1)(h) | compliant | not_applicable | mismatch | 1107 | None |
| label7.json | 16(1)(d) | non_compliant | not_applicable | mismatch | 920 | None |
