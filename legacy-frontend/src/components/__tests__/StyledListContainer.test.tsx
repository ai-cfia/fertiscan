import { fireEvent, render, screen } from "@testing-library/react";
import StyledListContainer from "../StyledListContainer";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Mock translation function
  }),
}));

describe("StyledListContainer", () => {
  const mockOnAppend = jest.fn();
  const defaultProps = {
    path: "testPath",
    verified: false,
    onAppend: mockOnAppend,
    children: <div data-testid="child">Child Content</div>,
  };

  it("renders children correctly", () => {
    render(<StyledListContainer {...defaultProps} />);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders the add button when not verified", () => {
    render(<StyledListContainer {...defaultProps} />);
    expect(screen.getByTestId("add-button-testPath")).toBeInTheDocument();
  });

  it("hides the add button when verified is true", () => {
    render(<StyledListContainer {...defaultProps} verified />);
    expect(screen.getByTestId("add-button-testPath")).toHaveClass("!hidden");
  });

  it("calls onAppend when add button is clicked", () => {
    render(<StyledListContainer {...defaultProps} />);
    const addButton = screen.getByTestId("add-button-testPath");
    fireEvent.click(addButton);
    expect(mockOnAppend).toHaveBeenCalled();
  });

  it("disables add button when verified is true", () => {
    render(<StyledListContainer {...defaultProps} verified />);
    expect(screen.getByTestId("add-button-testPath")).toHaveClass("!hidden");
  });

  it("applies correct data-testid to container", () => {
    render(<StyledListContainer {...defaultProps} />);
    expect(screen.getByTestId("fields-container-testPath")).toBeInTheDocument();
  });
});
