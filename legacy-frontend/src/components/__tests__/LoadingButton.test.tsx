import { ButtonProps } from "@mui/material";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoadingButton from "../LoadingButton";

describe("LoadingButton", () => {
  const defaultProps: ButtonProps & { loading: boolean; text: string } = {
    loading: false,
    text: "Click me",
  };

  it("renders the button with provided text", () => {
    render(<LoadingButton {...defaultProps} />);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders children if provided", () => {
    render(
      <LoadingButton {...defaultProps}>
        <span>Custom Child</span>
      </LoadingButton>,
    );
    expect(screen.getByText("Custom Child")).toBeInTheDocument();
  });

  it("disables button when loading is true", () => {
    render(<LoadingButton {...defaultProps} loading />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables button when disabled prop is true", () => {
    render(<LoadingButton {...defaultProps} disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows loading spinner when loading is true", () => {
    render(<LoadingButton {...defaultProps} loading />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("does not show spinner when loading is false", () => {
    render(<LoadingButton {...defaultProps} />);
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("fires onClick when clicked", async () => {
    const onClick = jest.fn();
    render(<LoadingButton {...defaultProps} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
