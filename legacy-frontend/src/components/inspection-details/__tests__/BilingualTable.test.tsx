import { BilingualField } from "@/types/types";
import { render, screen } from "@testing-library/react";
import BilingualTable from "../BilingualTable";

const renderWith = (data: BilingualField[]) =>
  render(<BilingualTable data={data} />);

describe("BilingualTable", () => {
  const mockData: BilingualField[] = [
    { en: "Age", fr: "Âge", value: "25", unit: "years", verified: true },
    { en: "Name", fr: "Nom", verified: true },
  ];

  it("renders table headers", () => {
    renderWith(mockData);
    expect(
      screen.getByText("bilingualTable.tableHeaders.english"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("bilingualTable.tableHeaders.french"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("bilingualTable.tableHeaders.value"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("bilingualTable.tableHeaders.unit"),
    ).toBeInTheDocument();
  });

  it("renders bilingual data", () => {
    renderWith(mockData);
    expect(
      screen.getByTestId("bilingual-table-row-0-english"),
    ).toHaveTextContent("Age");
    expect(
      screen.getByTestId("bilingual-table-row-0-french"),
    ).toHaveTextContent("Âge");
    expect(
      screen.getByTestId("bilingual-table-row-1-english"),
    ).toHaveTextContent("Name");
    expect(
      screen.getByTestId("bilingual-table-row-1-french"),
    ).toHaveTextContent("Nom");
  });

  it("renders value and unit when available", () => {
    renderWith(mockData);
    expect(screen.getByTestId("bilingual-table-row-0-value")).toHaveTextContent(
      "25",
    );
    expect(screen.getByTestId("bilingual-table-row-0-unit")).toHaveTextContent(
      "years",
    );
  });

  it("does not render value and unit columns if missing", () => {
    renderWith([{ en: "Test", fr: "Test FR", verified: false }]);
    expect(
      screen.queryByTestId("bilingual-table-header-value"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("bilingual-table-header-unit"),
    ).not.toBeInTheDocument();
  });
});
