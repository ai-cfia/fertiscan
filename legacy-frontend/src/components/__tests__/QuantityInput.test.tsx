import { Quantity } from "@/types/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Control,
  FormProvider,
  RegisterOptions,
  useForm,
} from "react-hook-form";
import QuantityInput from "../QuantityInput";

interface WrapperProps {
  name?: string;
  unitOptions?: string[];
  disabled?: boolean;
  unitRules?: RegisterOptions;
  onFocus?: () => void;
  onblur?: () => void;
  defaultValues?: Record<string, Quantity>;
  onSubmit?: (data: Record<string, Quantity>) => void;
}

const Wrapper = ({
  name = "testQuantityInput",
  unitOptions = ["kg", "lb", "oz"],
  disabled = false,
  unitRules,
  onFocus = jest.fn(),
  onblur = jest.fn(),
  defaultValues = {
    testQuantityInput: { value: "", unit: "" },
  },
  onSubmit = jest.fn(),
}: WrapperProps) => {
  const methods = useForm({
    defaultValues,
    mode: "onSubmit",
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          methods.handleSubmit(onSubmit)();
        }}
      >
        <QuantityInput
          name={name}
          control={methods.control as Control}
          unitOptions={unitOptions}
          disabled={disabled}
          unitRules={unitRules}
          onFocus={onFocus}
          onBlur={onblur}
        />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </FormProvider>
  );
};

const validateDuplicateUnit = (
  value: string,
  quantities: { unit: string }[],
) => {
  const isDuplicate =
    quantities.filter((item: { unit: string }) => item.unit === value).length >
    1;
  return !isDuplicate || "errors.duplicateUnit";
};

describe("QuantityInput rendering", () => {
  it("renders correctly with default settings", () => {
    render(<Wrapper />);
    expect(
      screen.getByTestId("testQuantityInput-container"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("testQuantityInput-value-input"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("testQuantityInput-unit-input"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("renders with disabled fields when the disabled prop is true", () => {
    render(<Wrapper disabled={true} />);
    const valueInput = screen
      .getByTestId("testQuantityInput-value-input")
      .querySelector("input");
    const unitInput = screen
      .getByTestId("testQuantityInput-unit-input")
      .querySelector("input");

    expect(valueInput).toBeDisabled();
    expect(unitInput).toBeDisabled();
  });
});

describe("QuantityInput functionality", () => {
  it("triggers validation for non-numeric input in the value field", async () => {
    render(<Wrapper />);

    const valueInput = screen
      .getByTestId("testQuantityInput-value-input")
      .querySelector("input");

    if (valueInput) {
      await userEvent.type(valueInput, "invalid");
    }

    screen.getByTestId("submit-button").click();

    const valueError = await screen.findByText("errors.numbersOnly");
    expect(valueError).toBeInTheDocument();
  });

  it("triggers validation for duplicate unit selection", async () => {
    const quantities = [{ unit: "kg" }, { unit: "kg" }];
    const unitRules = {
      validate: (value: string) => validateDuplicateUnit(value, quantities),
    };

    render(<Wrapper unitRules={unitRules} />);

    const unitInput = screen
      .getByTestId("testQuantityInput-unit-input")
      .querySelector("input");

    if (unitInput) {
      await userEvent.type(unitInput, "kg");
    }

    screen.getByTestId("submit-button").click();

    const unitError = await screen.findByText("errors.duplicateUnit");
    expect(unitError).toBeInTheDocument();
  });

  it("trims spaces on blur in the value field", async () => {
    render(<Wrapper />);

    const valueInput = screen
      .getByTestId("testQuantityInput-value-input")
      .querySelector("input");

    if (valueInput) {
      await userEvent.type(valueInput, " 123 ");
      await userEvent.tab();
    }

    expect(valueInput?.value).toBe("123");
  });

  it("submits correct data when valid inputs are provided", async () => {
    const mockSubmit = jest.fn();
    render(
      <Wrapper
        onSubmit={mockSubmit}
        defaultValues={{
          testQuantityInput: { value: "10", unit: "kg" },
        }}
      />,
    );

    const valueInput = screen
      .getByTestId("testQuantityInput-value-input")
      .querySelector("input");
    const unitInput = screen
      .getByTestId("testQuantityInput-unit-input")
      .querySelector("input");

    if (valueInput) {
      await userEvent.clear(valueInput);
      await userEvent.type(valueInput, "20");
    }
    if (unitInput) {
      await userEvent.clear(unitInput);
      await userEvent.type(unitInput, "lb");
    }

    await userEvent.click(screen.getByTestId("submit-button"));

    expect(mockSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        testQuantityInput: { value: "20", unit: "lb" },
      }),
    );
  });
});

export default Wrapper;
