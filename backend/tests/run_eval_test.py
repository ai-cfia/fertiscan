import pytest


def run():
    pytest.main(
        [
            "-v",
            "--tb=native",
            "tests/test_routes/labels/test_evaluate_non_compliance.py::TestEvaluateNonCompliance::test_evaluate_non_compliance_lot_number_success",
        ]
    )


if __name__ == "__main__":
    run()
