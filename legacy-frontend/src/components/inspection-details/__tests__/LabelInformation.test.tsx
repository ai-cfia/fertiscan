import { RegistrationType } from "@/types/types";
import { VERIFIED_LABEL_DATA } from "@/utils/client/constants";
import { fireEvent, render, screen } from "@testing-library/react";
import LabelInformation from "../LabelInformation";

jest.mock("@/components/QuantityChips", () => ({
  QuantityChips: jest.fn(() => <div data-testid="quantity-chips" />),
}));

describe("LabelInformation", () => {
  const mockSetNotes = jest.fn();

  it("does not render if labelData is null", () => {
    const { container } = render(
      <LabelInformation
        labelData={null}
        setNotes={mockSetNotes}
        disableNotes={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders label information correctly", () => {
    render(
      <LabelInformation
        labelData={VERIFIED_LABEL_DATA}
        setNotes={mockSetNotes}
        disableNotes={false}
      />,
    );

    expect(
      screen.getByText(VERIFIED_LABEL_DATA.baseInformation.name.value),
    ).toBeInTheDocument();

    VERIFIED_LABEL_DATA.baseInformation.registrationNumbers.values.forEach(
      ({ identifier, type }) =>
        expect(
          screen.getByText(
            `${identifier} (baseInformation.regType.${type === RegistrationType.FERTILIZER ? "fertilizer" : "ingredient"})`,
          ),
        ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(VERIFIED_LABEL_DATA.baseInformation.lotNumber.value),
    ).toBeInTheDocument();
    expect(
      screen.getByText(VERIFIED_LABEL_DATA.baseInformation.npk.value),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("quantity-chips")).toHaveLength(3);

    VERIFIED_LABEL_DATA.organizations.forEach(
      ({ name, address, website, phoneNumber }) => {
        expect(screen.getByText(name.value)).toBeInTheDocument();
        expect(screen.getByText(address.value)).toBeInTheDocument();
        expect(screen.getByText(website.value)).toBeInTheDocument();
        expect(screen.getByText(phoneNumber.value)).toBeInTheDocument();
      },
    );

    expect(
      screen.getByText(VERIFIED_LABEL_DATA.guaranteedAnalysis.titleEn.value),
    ).toBeInTheDocument();
    expect(
      screen.getByText(VERIFIED_LABEL_DATA.guaranteedAnalysis.titleFr.value),
    ).toBeInTheDocument();
    expect(screen.getByText("yes")).toBeInTheDocument();

    VERIFIED_LABEL_DATA.ingredients.nutrients.forEach(({ en }) => {
      expect(screen.getByText(en)).toBeInTheDocument();
    });

    VERIFIED_LABEL_DATA.guaranteedAnalysis.nutrients.forEach(({ en }) => {
      expect(screen.getAllByText(en).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Potassium (K)")).toHaveLength(2);

    expect(screen.getByText(VERIFIED_LABEL_DATA.comment!)).toBeInTheDocument();

    const notesField = screen.getByPlaceholderText("notes.placeholder");
    fireEvent.change(notesField, { target: { value: "Updated comment" } });
    expect(mockSetNotes).toHaveBeenCalledWith("Updated comment");
  });

  it("disables notes input when disableNotes is true", () => {
    render(
      <LabelInformation
        labelData={VERIFIED_LABEL_DATA}
        setNotes={mockSetNotes}
        disableNotes={true}
      />,
    );
    const notesField = screen.getByPlaceholderText("notes.placeholder");
    expect(notesField).toBeDisabled();
  });
});
