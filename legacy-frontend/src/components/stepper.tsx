import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingButton from "./LoadingButton";

/**
 * @enum {StepStatus}
 *
 * Enum representing the status of a step in a stepper component.
 */
export enum StepStatus {
  Incomplete = "incomplete",
  Completed = "completed",
  Error = "error",
}

/**
 * Props for the Stepper component.
 *
 * @interface StepperProps
 *
 * @property {string[]} stepTitles - An array of titles for each step in the stepper.
 * @property {StepStatus[]} stepStatuses - An array of statuses for each step in the stepper.
 * @property {number} activeStep - The index of the currently active step.
 * @property {React.Dispatch<React.SetStateAction<number>>} setActiveStep - Function to set the active step.
 * @property {() => void} submit - Function to be called when the stepper is submitted.
 */
export interface StepperProps {
  stepTitles: string[];
  stepStatuses: StepStatus[];
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  submit: () => void;
}

/**
 * A non-linear horizontal stepper component.
 *
 * @param {StepperProps} props - The properties for the stepper component.
 * @param {string[]} props.stepTitles - An array of titles for each step.
 * @param {StepStatus[]} props.stepStatuses - An array of statuses for each step.
 * @param {number} props.activeStep - The index of the currently active step.
 * @param {React.Dispatch<React.SetStateAction<number>>} props.setActiveStep - Function to set the active step.
 * @returns {JSX.Element} The rendered horizontal non-linear stepper component.
 */
export const HorizontalNonLinearStepper: React.FC<StepperProps> = ({
  stepTitles,
  stepStatuses,
  activeStep,
  setActiveStep,
}) => {
  const stepRefs = useRef<HTMLDivElement[]>([]);
  const handleStep = (step: number) => () => setActiveStep(step);

  // Scroll to the active step when it changes
  useEffect(() => {
    const currentStepRef = stepRefs.current[activeStep];
    if (currentStepRef && currentStepRef.scrollIntoView) {
      currentStepRef.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeStep, stepRefs]);

  return (
    <Box className="w-full overflow-x-auto overflow-y-hidden">
      <Stepper nonLinear activeStep={activeStep} className="mx-2">
        {stepTitles.map((title, index) => (
          <Step
            key={index}
            completed={stepStatuses[index] === StepStatus.Completed}
            ref={(el) => {
              if (el) {
                stepRefs.current[index] = el;
              }
            }}
          >
            <StepButton onClick={handleStep(index)}>
              <StepLabel error={stepStatuses[index] === StepStatus.Error}>
                {title}
              </StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

/**
 * StepperControls component provides navigation controls for a multi-step process.
 * It includes buttons to navigate between steps and a submit button.
 *
 * @param {StepperProps} props - The properties for the StepperControls component.
 * @param {string[]} props.stepTitles - An array of titles for each step.
 * @param {number} props.activeStep - The index of the currently active step.
 * @param {StepStatus[]} props.stepStatuses - An array of statuses for each step.
 * @param {Function} props.setActiveStep - Function to set the active step.
 * @param {Function} props.submit - Function to handle the submission of the stepper.
 * @returns {JSX.Element} The rendered StepperControls component.
 */
export const StepperControls: React.FC<StepperProps> = ({
  stepTitles,
  activeStep,
  stepStatuses,
  setActiveStep,
  submit,
}) => {
  const { t } = useTranslation("labelDataValidator");
  const stepsTotal = stepTitles.length;
  const [loading, setLoading] = useState(false);

  // Handle submission of the stepper
  const handleSubmission = () => {
    setLoading(true);
    submit();
  };

  return (
    <Box className="flex flex-col gap-2 content-center">
      <Box className="flex justify-between pt-2 w-full">
        <Button
          disabled={activeStep === 0}
          onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
          variant="contained"
          color="secondary"
        >
          {t("stepper.back")}
        </Button>
        <LoadingButton
          onClick={handleSubmission}
          disabled={stepStatuses.some(
            (value) => value !== StepStatus.Completed,
          )}
          loading={loading}
          text={t("stepper.submit")}
          variant="contained"
          color="secondary"
        />
        <Button
          onClick={() =>
            setActiveStep((prev) => Math.min(prev + 1, stepsTotal - 1))
          }
          disabled={activeStep >= stepsTotal - 1}
          variant="contained"
          color="secondary"
        >
          {t("stepper.next")}
        </Button>
      </Box>
    </Box>
  );
};
