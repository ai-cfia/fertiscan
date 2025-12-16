import { RegistrationNumber, RegistrationType } from "@/types/types";
import { render, screen } from "@testing-library/react";
import { RegistrationChips } from "../RegistrationChips";

describe("RegistrationChips", () => {
  it("renders registration numbers with translated labels", () => {
    const registrations: RegistrationNumber[] = [
      { identifier: "1234567A", type: RegistrationType.FERTILIZER },
      { identifier: "8901234B", type: RegistrationType.INGREDIENT },
    ];

    render(<RegistrationChips registrations={registrations} />);

    expect(
      screen.getByText("1234567A (baseInformation.regType.fertilizer)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("8901234B (baseInformation.regType.ingredient)"),
    ).toBeInTheDocument();
  });

  it("does not render chips for registrations without an identifier", () => {
    const registrations: RegistrationNumber[] = [
      { identifier: "", type: RegistrationType.FERTILIZER },
      { identifier: "8901234B", type: RegistrationType.INGREDIENT },
    ];

    render(<RegistrationChips registrations={registrations} />);

    expect(
      screen.queryByText(" (baseInformation.regType.fertilizer)"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("8901234B (baseInformation.regType.ingredient)"),
    ).toBeInTheDocument();
  });

  it("renders correctly with an empty list", () => {
    render(<RegistrationChips registrations={[]} />);

    expect(screen.queryByRole("chip")).not.toBeInTheDocument();
  });
});
