import { VerifiedTextField } from "@/types/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { VerifiedInput } from "../VerifiedFieldComponents";

const TestWrapper = ({
  verified,
  loading = false,
}: {
  verified: boolean;
  loading?: boolean;
}) => {
  const methods = useForm<Record<string, VerifiedTextField>>({
    defaultValues: {
      fieldName: {
        value: "",
        verified: verified,
      },
    },
  });

  return (
    <FormProvider {...methods}>
      <form>
        <VerifiedInput
          label="Test Field"
          placeholder="Enter text"
          path="fieldName"
          className="test-class"
          loading={loading}
        />
      </form>
    </FormProvider>
  );
};

describe("VerifiedInput Behavior", () => {
  it("should render all elements with correct attributes and content", () => {
    render(<TestWrapper verified={false} />);

    const label = screen.getByTestId("field-label-fieldName");
    expect(label).toHaveTextContent("Test Field");

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("name", "fieldName.value");
    expect(input).toHaveValue("");

    expect(
      screen.getByTestId("input-field-fieldName.value"),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("toggle-verified-btn-fieldName.verified"),
    ).toBeInTheDocument();
  });

  it("should disable the input field when verifiedValue is true", () => {
    render(<TestWrapper verified={true} />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeDisabled();
  });

  it("should enable the input field when verifiedValue is false", () => {
    render(<TestWrapper verified={false} />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).not.toBeDisabled();
  });

  it("should toggle verified between true and false on IconButton click", () => {
    render(<TestWrapper verified={false} />);
    const toggleButton = screen.getByTestId(
      "toggle-verified-btn-fieldName.verified",
    );
    const verifiedIcon = screen.getByTestId("verified-icon-fieldName.verified");
    expect(verifiedIcon).not.toHaveClass("text-green-500");
    fireEvent.click(toggleButton);
    expect(verifiedIcon).toHaveClass("text-green-500");
    expect(screen.getByTestId("verified-field-fieldName")).toHaveClass(
      "border-green-500",
    );
    fireEvent.click(toggleButton);
    expect(verifiedIcon).not.toHaveClass("text-green-500");
    expect(screen.getByTestId("verified-field-fieldName")).not.toHaveClass(
      "border-green-500",
    );
  });

  it("should display a skeleton when loading is true", () => {
    render(<TestWrapper verified={false} loading={true} />);

    const skeleton = screen.getByTestId("styled-skeleton");
    expect(skeleton).toBeInTheDocument();

    const input = screen.queryByPlaceholderText("Enter text");
    expect(input).not.toBeInTheDocument();
  });
});
