import { fireEvent, render, screen } from "@testing-library/react";
import VerifiedListRow from "../VerifiedListRow";

describe("VerifiedListRow", () => {
  const mockOnDelete = jest.fn();
  const defaultProps = {
    verified: false,
    hideDelete: false,
    onDelete: mockOnDelete,
    isLastItem: false,
    children: <div data-testid="child">Child Content</div>,
  };

  it("renders children correctly", () => {
    render(<VerifiedListRow {...defaultProps} />);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows delete button when verified is false and hideDelete is false", () => {
    render(<VerifiedListRow {...defaultProps} />);
    expect(screen.getByTestId("styled-delete-button")).toBeInTheDocument();
  });

  it("hides delete button when verified is true", () => {
    render(<VerifiedListRow {...defaultProps} verified />);
    expect(
      screen.queryByTestId("styled-delete-button"),
    ).not.toBeInTheDocument();
  });

  it("hides delete button when hideDelete is true", () => {
    render(<VerifiedListRow {...defaultProps} hideDelete />);
    expect(
      screen.queryByTestId("styled-delete-button"),
    ).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", () => {
    render(<VerifiedListRow {...defaultProps} />);
    const deleteButton = screen.getByTestId("styled-delete-button");
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it("renders divider with green background when verified is true", () => {
    render(<VerifiedListRow {...defaultProps} verified />);
    const divider = screen.getByRole("separator");
    expect(divider).toHaveClass("bg-green-500");
  });

  it("hides divider when isLastItem is true and verified is true", () => {
    render(<VerifiedListRow {...defaultProps} verified isLastItem />);

    const divider = screen.getByRole("separator");
    expect(divider).toHaveClass("hidden");
  });

  it("shows divider when isLastItem is false", () => {
    render(<VerifiedListRow {...defaultProps} />);
    const divider = screen.getByRole("separator");
    expect(divider).toBeInTheDocument();
  });
});
