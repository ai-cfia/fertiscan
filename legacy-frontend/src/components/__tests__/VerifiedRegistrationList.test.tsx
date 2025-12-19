import { RegistrationNumbers, RegistrationType } from "@/types/types";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import VerifiedRegistrationList from "../VerifiedRegistrationList";

const Wrapper = ({
  label = "Test Label",
  path = "",
  defaultValues = {
    values: [{ identifier: "12345", type: RegistrationType.FERTILIZER }],
    verified: false,
  },
  loading = false,
  onSubmit = jest.fn(),
}: {
  label?: string;
  path?: string;
  defaultValues?: RegistrationNumbers;
  loading?: boolean;
  onSubmit?: (data: RegistrationNumbers) => void;
}) => {
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
        <VerifiedRegistrationList label={label} path={path} loading={loading} />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </FormProvider>
  );
};

describe("VerifiedRegistrationList rendering", () => {
  it("renders correctly with default settings", () => {
    render(<Wrapper />);

    expect(screen.getByTestId("field-label-")).toHaveTextContent(
      "Test Label",
    );
    expect(screen.getByTestId("add-button-")).toBeInTheDocument();
    expect(screen.getByTestId(/^toggle-verified-btn-/)).toBeInTheDocument();

    const identifierInputs = screen.getAllByTestId(/values\.\d+-number-input/);
    expect(identifierInputs.length).toBe(1);
    expect(
      (identifierInputs[0].querySelector("input") as HTMLInputElement).value,
    ).toBe("12345");

    const typeInputs = screen.getAllByRole("combobox");
    expect(typeInputs.length).toBe(1);
    expect(typeInputs[0]).toHaveTextContent(
      "registrationInput.type.fertilizer",
    );
  });

  it("renders the correct number of rows based on defaultValues", () => {
    const defaultValues = {
      values: [
        { identifier: "ABC123", type: RegistrationType.FERTILIZER },
        { identifier: "XYZ789", type: RegistrationType.INGREDIENT },
      ],
      verified: false,
    };
    render(<Wrapper defaultValues={defaultValues} />);

    const fieldRows = screen.getAllByTestId("field-row");
    expect(fieldRows.length).toBe(2);

    const identifierInputs = screen.getAllByTestId(/values\.\d+-number-input/);
    expect(identifierInputs.length).toBe(2);
    expect(
      (identifierInputs[0].querySelector("input") as HTMLInputElement).value,
    ).toBe("ABC123");
    expect(
      (identifierInputs[1].querySelector("input") as HTMLInputElement).value,
    ).toBe("XYZ789");

    const typeInputs = screen.getAllByRole("combobox");
    expect(typeInputs.length).toBe(2);
    expect(typeInputs[0]).toHaveTextContent(
      "registrationInput.type.fertilizer",
    );
    expect(typeInputs[1]).toHaveTextContent(
      "registrationInput.type.ingredient",
    );
  });

  it("handles loading state correctly", () => {
    const { rerender } = render(<Wrapper loading={true} />);

    expect(screen.getByTestId("styled-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("add-button-")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(/values\.\d+-number-input/),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    rerender(<Wrapper loading={false} />);

    expect(screen.queryByTestId("styled-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTestId("add-button-")).toBeInTheDocument();
    expect(screen.getAllByTestId(/values\.\d+-number-input/).length).toBe(1);
    expect(screen.getAllByRole("combobox").length).toBe(1);
  });
});

describe("VerifiedRegistrationList functionality", () => {
  it("disables input fields and add row button when verified is true", async () => {
    const defaultValues = {
      values: [{ identifier: "ABC123", type: RegistrationType.FERTILIZER }],
      verified: true,
    };
    render(<Wrapper defaultValues={defaultValues} />);

    screen.getAllByTestId(/values\.\d+-number-input/).forEach((field) => {
      expect(field.querySelector("input")).toBeDisabled();
    });

    screen.getAllByRole("combobox").forEach((dropdown) => {
      expect(dropdown).toHaveAttribute("aria-disabled", "true");
    });

    expect(screen.getByTestId("add-button-")).toBeDisabled();
    expect(screen.getByTestId("verified-field-")).toHaveClass(
      "border-green-500 bg-gray-300",
    );

    userEvent.click(screen.getByTestId("toggle-verified-btn-.verified"));

    screen.getAllByTestId(/values\.\d+-number-input/).forEach((field) => {
      expect(field.querySelector("input")).toBeDisabled();
    });

    screen.getAllByRole("combobox").forEach((dropdown) => {
      expect(dropdown).toHaveAttribute("aria-disabled", "true");
    });

    expect(screen.getByTestId("add-button-")).toBeDisabled();
  });

  it("handles adding and removing rows correctly", () => {
    const defaultValues = {
      values: [
        { identifier: "ABC123", type: RegistrationType.FERTILIZER },
        { identifier: "XYZ789", type: RegistrationType.INGREDIENT },
      ],
      verified: false,
    };
    render(<Wrapper defaultValues={defaultValues} />);

    let fieldRows = screen.getAllByTestId("field-row");
    expect(fieldRows.length).toBe(2);

    const removeButtons = screen.getAllByTestId("styled-delete-button");
    fireEvent.click(removeButtons[0]);

    fieldRows = screen.queryAllByTestId("field-row");
    expect(fieldRows.length).toBe(1);

    fireEvent.click(screen.getByTestId("add-button-"));

    fieldRows = screen.getAllByTestId("field-row");
    expect(fieldRows.length).toBe(2);
  });

  it("calls onSubmit with correct values", async () => {
    const mockOnSubmit = jest.fn();
    const defaultValues = {
      values: [{ identifier: "12345", type: RegistrationType.FERTILIZER }],
      verified: false,
    };

    render(<Wrapper defaultValues={defaultValues} onSubmit={mockOnSubmit} />);

    const identifierInputs = screen.getAllByTestId(/values\.\d+-number-input/);
    expect(identifierInputs.length).toBe(1);

    const inputField = identifierInputs[0].querySelector(
      "input",
    ) as HTMLInputElement;
    expect(inputField).toHaveValue("12345");

    await userEvent.clear(inputField);
    await userEvent.type(inputField, "1234567A");

    const typeInputs = screen.getAllByRole("combobox");
    expect(typeInputs.length).toBe(1);

    await userEvent.click(typeInputs[0]);
    await userEvent.keyboard("{ArrowDown}{Enter}");

    await userEvent.click(screen.getByTestId(/^toggle-verified-btn-/));
    await userEvent.click(screen.getByTestId("submit-button"));

    expect(mockOnSubmit).toHaveBeenCalled();
    expect(mockOnSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        values: [{ identifier: "1234567A", type: RegistrationType.INGREDIENT }],
        verified: true,
      }),
    );
  });
});
