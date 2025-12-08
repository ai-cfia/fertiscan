import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import {
  HorizontalNonLinearStepper,
  StepperControls,
  StepStatus,
} from "../stepper";

interface TestStepperWrapperProps {
  steps?: string[];
  initialStepStatuses?: StepStatus[];
  initialActiveStep?: number;
}

const TestStepperWrapper: React.FC<TestStepperWrapperProps> = ({
  steps = ["Step 1", "Step 2", "Step 3", "Step 4"],
  initialStepStatuses = [
    StepStatus.Completed,
    StepStatus.Incomplete,
    StepStatus.Error,
    StepStatus.Incomplete,
  ],
  initialActiveStep = 0,
}) => {
  const [activeStep, setActiveStep] = useState<number>(initialActiveStep);
  const [stepStatuses] = useState<StepStatus[]>(initialStepStatuses);
  // create a mock submit function
  const submit = jest.fn();

  return (
    <>
      <HorizontalNonLinearStepper
        stepTitles={steps}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        stepStatuses={stepStatuses}
        submit={submit}
      />
      <StepperControls
        stepTitles={steps}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        stepStatuses={stepStatuses}
        submit={submit}
      />
    </>
  );
};

describe("HorizontalNonLinearStepper with StepperControls", () => {
  it("renders the correct number of steps", () => {
    const { container } = render(<TestStepperWrapper />);
    const renderedSteps = container.querySelectorAll(".MuiStepButton-root");
    expect(renderedSteps).toHaveLength(4);
  });

  it("indicates the correct active step", () => {
    const { container } = render(<TestStepperWrapper initialActiveStep={1} />);
    const activeStepButton = container.querySelectorAll(
      ".MuiStepButton-root",
    )[1];
    expect(activeStepButton).toHaveAttribute("aria-current", "step");
  });

  it("displays step statuses correctly", () => {
    const steps = ["Step 1", "Step 2", "Step 3", "Step 4"];
    const stepStatuses = [
      StepStatus.Completed,
      StepStatus.Incomplete,
      StepStatus.Error,
      StepStatus.Incomplete,
    ];

    render(
      <TestStepperWrapper steps={steps} initialStepStatuses={stepStatuses} />,
    );

    steps.forEach((_, index) => {
      const stepLabel = screen.getByText(steps[index]);

      if (stepStatuses[index] === StepStatus.Completed) {
        expect(stepLabel).toHaveClass("Mui-completed");
      } else if (stepStatuses[index] === StepStatus.Error) {
        expect(stepLabel).toHaveClass("Mui-error");
      } else {
        expect(stepLabel).not.toHaveClass("Mui-completed");
        expect(stepLabel).not.toHaveClass("Mui-error");
      }
    });
  });

  it("navigates to the next step when 'Next' button is clicked", () => {
    const { container } = render(<TestStepperWrapper />);
    const nextButton = screen.getByText("stepper.next");
    fireEvent.click(nextButton);

    const activeStepButton = container.querySelectorAll(
      ".MuiStepButton-root",
    )[1];
    expect(activeStepButton).toHaveAttribute("aria-current", "step");
  });

  it("navigates to the previous step when 'Back' button is clicked", () => {
    const { container } = render(<TestStepperWrapper initialActiveStep={1} />);
    const backButton = screen.getByText("stepper.back");
    fireEvent.click(backButton);

    const activeStepButton = container.querySelectorAll(
      ".MuiStepButton-root",
    )[0];
    expect(activeStepButton).toHaveAttribute("aria-current", "step");
  });

  it("disables 'Back' button on the first step", () => {
    render(<TestStepperWrapper />);
    const backButton = screen.getByText("stepper.back");
    const nextButton = screen.getByText("stepper.next");

    expect(backButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("disables 'Next' button on the last step", () => {
    render(<TestStepperWrapper initialActiveStep={3} />);
    const nextButton = screen.getByText("stepper.next");

    expect(nextButton).toBeDisabled();
  });

  it("handles an empty steps array without errors", () => {
    const { container } = render(
      <TestStepperWrapper steps={[]} initialStepStatuses={[]} />,
    );
    const stepButtons = container.querySelectorAll(".MuiStepButton-root");
    expect(stepButtons).toHaveLength(0);
  });

  it("handles out-of-range activeStep gracefully", () => {
    const { container } = render(
      <TestStepperWrapper
        steps={["Step 1", "Step 2"]}
        initialActiveStep={5}
        initialStepStatuses={[StepStatus.Completed, StepStatus.Incomplete]}
      />,
    );
    const renderedSteps = container.querySelectorAll(".MuiStepButton-root");
    expect(renderedSteps).toHaveLength(2);
  });

  it("disables 'Submit' button when there are incomplete steps", () => {
    render(
      <TestStepperWrapper
        initialStepStatuses={[
          StepStatus.Completed,
          StepStatus.Incomplete,
          StepStatus.Error,
          StepStatus.Incomplete,
        ]}
      />,
    );
    const submitButton = screen.getByText("stepper.submit").closest("button");
    expect(submitButton).toBeDisabled();
  });

  it("enables 'Submit' button when all steps are completed", () => {
    render(
      <TestStepperWrapper
        initialStepStatuses={[
          StepStatus.Completed,
          StepStatus.Completed,
          StepStatus.Completed,
          StepStatus.Completed,
        ]}
      />,
    );
    const submitButton = screen.getByText("stepper.submit");
    expect(submitButton).not.toBeDisabled();
  });
});
