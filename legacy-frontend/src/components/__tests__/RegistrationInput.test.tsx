import { RegistrationType } from "@/types/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Control,
  FormProvider,
  RegisterOptions,
  useForm,
} from "react-hook-form";
import RegistrationInput from "../RegistrationInput";

interface WrapperProps {
  name?: string;
  disabled?: boolean;
  typeRules?: RegisterOptions;
  onFocus?: () => void;
  onBlur?: () => void;
  defaultValues?: Record<string, { identifier: string; type: string }>;
  onSubmit?: (
    data: Record<string, { identifier: string; type: string }>,
  ) => void;
}

const Wrapper = ({
  name = "testRegistrationInput",
  disabled = false,
  typeRules,
  onFocus = jest.fn(),
  onBlur = jest.fn(),
  defaultValues = {
    testRegistrationInput: { identifier: "", type: "" },
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
        <RegistrationInput
          name={name}
          control={methods.control as Control}
          disabled={disabled}
          typeRules={typeRules}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </FormProvider>
  );
};

describe("RegistrationInput rendering", () => {
  it("renders correctly with default settings", () => {
    render(<Wrapper />);

    expect(
      screen.getByTestId("testRegistrationInput-container"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("testRegistrationInput-number-input"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("renders with disabled fields when the disabled prop is true", () => {
    render(<Wrapper disabled={true} />);

    const identifierInput = screen
      .getByTestId("testRegistrationInput-number-input")
      .querySelector("input");
    const typeSelect = screen.getByRole("combobox");

    expect(identifierInput).toBeDisabled();
    expect(typeSelect).toHaveAttribute("aria-disabled", "true");
  });

  it("renders the correct registration type options", async () => {
    render(<Wrapper />);
    const select = screen.getByRole("combobox");
    await userEvent.click(select);
    expect(
      screen.getByRole("option", { name: /fertilizer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /ingredient/i }),
    ).toBeInTheDocument();
  });
});

describe("RegistrationInput functionality", () => {
  it("triggers validation for incorrect identifier format", async () => {
    render(<Wrapper />);

    const identifierInput = screen
      .getByTestId("testRegistrationInput-number-input")
      .querySelector("input");

    if (identifierInput) {
      await userEvent.type(identifierInput, "1234XYZ");
    }

    screen.getByTestId("submit-button").click();

    const identifierError = await screen.findByText(
      "errors.invalidRegistrationNumber",
    );
    expect(identifierError).toBeInTheDocument();
  });

  it("submits correct data when valid inputs are provided", async () => {
    const mockSubmit = jest.fn();
    render(
      <Wrapper
        onSubmit={mockSubmit}
        defaultValues={{
          testRegistrationInput: {
            identifier: "1234567A",
            type: RegistrationType.FERTILIZER,
          },
        }}
      />,
    );

    const identifierInput = screen
      .getByTestId("testRegistrationInput-number-input")
      .querySelector("input");

    if (identifierInput) {
      await userEvent.clear(identifierInput);
      await userEvent.type(identifierInput, "7654321B");
    }

    const typeSelect = screen.getByRole("combobox");
    await userEvent.click(typeSelect);

    const ingredientOption = screen.getByRole("option", {
      name: /ingredient/i,
    });
    await userEvent.click(ingredientOption);
    await userEvent.click(screen.getByTestId("submit-button"));

    expect(mockSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        testRegistrationInput: {
          identifier: "7654321B",
          type: RegistrationType.INGREDIENT,
        },
      }),
    );
  });
});
