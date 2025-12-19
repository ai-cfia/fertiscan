import { VerifiedQuantities } from "@/types/types";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import VerifiedQuantityList from "../VerifiedQuantityList";

const Wrapper = ({
  label = "Test Label",
  path = "",
  unitOptions = ["kg", "lb", "oz", "ton"],
  defaultValues = {
    quantities: [{ value: "0", unit: "kg" }],
    verified: false,
  },
  loading = false,
  onSubmit = jest.fn(),
}: {
  label?: string;
  placeholder?: string;
  path?: string;
  unitOptions?: string[];
  defaultValues?: VerifiedQuantities;
  loading?: boolean;
  onSubmit?: (data: VerifiedQuantities) => void;
}) => {
  const methods = useForm<VerifiedQuantities>({
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
        <VerifiedQuantityList
          label={label}
          path={path}
          unitOptions={unitOptions}
          loading={loading}
        />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </FormProvider>
  );
};

describe("QuantityMultiInput rendering", () => {
  it("renders correctly with default settings", () => {
    render(<Wrapper />);

    expect(screen.getByTestId("field-label-")).toHaveTextContent(
      "Test Label",
    );
    expect(screen.getByTestId("add-button-")).toBeInTheDocument();
    expect(screen.getByTestId(/^toggle-verified-btn-/)).toBeInTheDocument();

    const dropdowns = screen.getAllByTestId(/quantities\.\d+-value-input/);
    expect(dropdowns.length).toBe(1);
    expect(dropdowns[0].children.length).toBeGreaterThan(0);

    const inputFields = screen.getAllByTestId(/quantities\.\d+-value-input/);
    expect(inputFields.length).toBe(1);

    const inputField = inputFields[0].querySelector(
      "input",
    ) as HTMLInputElement;
    expect(inputField).toHaveValue("0");

    expect(screen.getByTestId("add-button-")).toBeInTheDocument();
  });

  it("renders the correct number of rows and dropdown options based on defaultValues", () => {
    const defaultValues = {
      quantities: [
        { value: "10", unit: "kg" },
        { value: "20", unit: "lb" },
      ],
      verified: false,
    };
    render(<Wrapper defaultValues={defaultValues} />);

    // Check number of field rows
    const fieldRows = screen.getAllByTestId("field-row");
    expect(fieldRows.length).toBe(2);

    // Check input values
    const valueInputs = screen.getAllByTestId(/\.quantities\.\d+-value-input/);
    expect(valueInputs.length).toBe(2);
    expect(
      (valueInputs[0].querySelector("input") as HTMLInputElement).value,
    ).toBe("10");
    expect(
      (valueInputs[1].querySelector("input") as HTMLInputElement).value,
    ).toBe("20");

    // Check unit dropdowns
    const unitInputs = screen.getAllByTestId(/\.quantities\.\d+-unit-input/);
    expect(unitInputs.length).toBe(2);
    expect(
      (unitInputs[0].querySelector("input") as HTMLInputElement).value,
    ).toBe("kg");
    expect(
      (unitInputs[1].querySelector("input") as HTMLInputElement).value,
    ).toBe("lb");
  });

  it("handles loading state correctly", () => {
    const { rerender } = render(<Wrapper loading={true} />);

    // Check if loading skeleton is displayed
    expect(screen.getByTestId("styled-skeleton")).toBeInTheDocument();

    // Ensure form elements are hidden during loading
    expect(screen.queryByTestId("add-button-")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("toggle-verified-btn-.verified"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(/\.quantities\.\d+-value-input/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(/\.quantities\.\d+-unit-input/),
    ).not.toBeInTheDocument();

    // Rerender with loading false
    rerender(<Wrapper loading={false} />);

    // Check if loading skeleton is removed
    expect(screen.queryByTestId("styled-skeleton")).not.toBeInTheDocument();

    // Ensure form elements are visible after loading
    expect(screen.getByTestId("add-button-")).toBeInTheDocument();
    expect(
      screen.getByTestId("toggle-verified-btn-.verified"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId(/\.quantities\.\d+-value-input/).length).toBe(
      1,
    );
    expect(screen.getAllByTestId(/\.quantities\.\d+-unit-input/).length).toBe(
      1,
    );
  });
});

describe("QuantityMultiInput functionality", () => {
  it("disables input fields and add row button when verified is true", () => {
    const defaultValues = {
      quantities: [{ value: "50", unit: "kg" }],
      verified: true,
    };
    render(<Wrapper defaultValues={defaultValues} />);

    // Ensure value and unit inputs are disabled
    screen.getAllByTestId(/\.quantities\.\d+-value-input/).forEach((field) => {
      expect(field.querySelector("input")).toBeDisabled();
    });
    screen
      .getAllByTestId(/\.quantities\.\d+-unit-input/)
      .forEach((dropdown) => {
        expect(dropdown.querySelector("input")).toBeDisabled();
      });

    // Ensure add button is disabled
    expect(screen.getByTestId("add-button-")).toBeDisabled();

    // Ensure verified style is applied
    expect(screen.getByTestId("verified-field-")).toHaveClass(
      "border-green-500 bg-gray-300",
    );

    // Toggle verification
    userEvent.click(screen.getByTestId("toggle-verified-btn-.verified"));

    // Ensure inputs and buttons remain disabled
    screen.getAllByTestId(/\.quantities\.\d+-value-input/).forEach((field) => {
      expect(field.querySelector("input")).toBeDisabled();
    });
    screen
      .getAllByTestId(/\.quantities\.\d+-unit-input/)
      .forEach((dropdown) => {
        expect(dropdown.querySelector("input")).toBeDisabled();
      });
    expect(screen.getByTestId("add-button-")).toBeDisabled();
  });

  it("handles adding and removing rows correctly", () => {
    const defaultValues = {
      quantities: [
        { value: "10", unit: "kg" },
        { value: "20", unit: "lb" },
      ],
      verified: false,
    };
    render(<Wrapper defaultValues={defaultValues} />);

    // Check initial row count
    let fieldRows = screen.getAllByTestId("field-row");
    expect(fieldRows.length).toBe(2);

    // Click remove button on first row
    const removeButtons = screen.getAllByTestId("styled-delete-button");
    fireEvent.click(removeButtons[0]);

    // Ensure one row is removed
    fieldRows = screen.queryAllByTestId("field-row");
    expect(fieldRows.length).toBe(1);

    // Click add button
    fireEvent.click(screen.getByTestId("add-button-"));

    // Ensure row is added back
    fieldRows = screen.getAllByTestId("field-row");
    expect(fieldRows.length).toBe(2);
  });

  // Not tested as now since verification are gonna be added in next PR

  // it("calls onSubmit with correct values", async () => {
  //   const mockOnSubmit = jest.fn();
  //   const defaultValues = {
  //     quantities: [{ value: "0", unit: "kg" }],
  //     verified: false,
  //   };

  //   render(<Wrapper defaultValues={defaultValues} onSubmit={mockOnSubmit} />);

  //   const inputFields = screen.getAllByTestId(/quantities\.\d+-value-input/);
  //   expect(inputFields.length).toBe(1);

  //   const inputField = inputFields[0].querySelector(
  //     "input",
  //   ) as HTMLInputElement;
  //   expect(inputField).toHaveValue("0");

  //   await userEvent.clear(inputField);
  //   await userEvent.type(inputField, "10");

  //   const dropdowns = screen.getAllByTestId(/quantities\.\d+-unit-input/);
  //   expect(dropdowns.length).toBe(1);

  //   const dropdownInput = dropdowns[0].querySelector(
  //     "input",
  //   ) as HTMLInputElement;
  //   await userEvent.clear(dropdownInput);
  //   await userEvent.type(dropdownInput, "lb");

  //   await userEvent.click(screen.getByTestId("toggle-verified-btn-"));

  //   await userEvent.click(screen.getByTestId("submit-button"));

  //   expect(mockOnSubmit.mock.calls[0][0]).toEqual(
  //     expect.objectContaining({
  //       quantities: [{ value: "10", unit: "lb" }],
  //       verified: true,
  //     }),
  //   );
  // });

  // it("doesn't allow toggling status when there are errors", async () => {
  //   const defaultValues = {
  //     quantities: [{ value: "0", unit: "kg" }],
  //     verified: false,
  //   };

  //   render(<Wrapper defaultValues={defaultValues} />);

  //   const inputFields = screen.getAllByTestId(/quantities\.\d+-value-input/);
  //   expect(inputFields.length).toBe(1);

  //   const inputField = inputFields[0].querySelector(
  //     "input",
  //   ) as HTMLInputElement;
  //   expect(inputField).toHaveValue("0");

  //   await userEvent.clear(inputField);
  //   await userEvent.type(inputField, "abc");

  //   const toggleButton = screen.getByTestId("verified-icon-");
  //   await userEvent.click(toggleButton);
  //   expect(toggleButton).not.toHaveClass("text-green-500");

  //   await userEvent.clear(inputField);
  //   await userEvent.type(inputField, "10");
  //   await userEvent.click(toggleButton);
  //   expect(toggleButton).toHaveClass("text-green-500");
  // });
});
