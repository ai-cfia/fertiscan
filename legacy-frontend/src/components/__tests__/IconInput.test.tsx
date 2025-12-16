import theme from "@/app/theme";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import IconInput from "@/components/IconInput";
import BugReportIcon from "@mui/icons-material/BugReport";
import React, { act } from "react";

describe("IconInput Component", () => {
  let mockValue = "";
  const mockChangeInputValue = jest.fn((value: string) => (mockValue = value));

  const testIcon = <BugReportIcon data-testid={"test-icon"}></BugReportIcon>;

  it("renders a text IconInput component and its sub-components", () => {
    render(
      <ThemeProvider theme={theme}>
        <IconInput
          id={"testInput"}
          icon={testIcon}
          placeholder={"test input"}
          type={"text"}
          value={mockValue}
          setValue={mockChangeInputValue}
        />
      </ThemeProvider>,
    );

    const input = screen.getByTestId("input");

    // Check if the icon passed in the props is rendered
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();

    // Check if the input is rendered
    expect(input).toBeInTheDocument();

    // Check that there is no showPassword button even when the input is focussed
    fireEvent.click(input);
    expect(screen.queryByTestId("VisibilityIcon")).not.toBeInTheDocument();
  });

  it("checks that the value setter function is called and that the value is changed (waits 200ms for state)", async () => {
    render(
      <ThemeProvider theme={theme}>
        <IconInput
          id={"testInput"}
          icon={testIcon}
          placeholder={"test input"}
          type={"text"}
          value={mockValue}
          setValue={mockChangeInputValue}
        />
      </ThemeProvider>,
    );

    const input = screen.getByTestId("input");

    const realInput = input.getElementsByTagName(
      "input",
    )[0] as HTMLInputElement;

    fireEvent.focus(realInput);

    fireEvent.change(realInput, {
      target: {
        value: "A",
      },
    });
    await act(async () => {
      expect(mockChangeInputValue).toHaveBeenCalled();
      await new Promise((r) => setTimeout(r, 200)); //! forced to wait for update !
    });
    expect(mockValue).toBe("A");
  });

  it("renders a password IconInput component and its sub-components", () => {
    render(
      <ThemeProvider theme={theme}>
        <IconInput
          id={"testInput"}
          icon={testIcon}
          placeholder={"test input"}
          type={"password"}
          value={mockValue}
          setValue={mockChangeInputValue}
        />
      </ThemeProvider>,
    );

    // Check if the icon passed in the props is rendered
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();

    const input = screen.getByTestId("input");
    const realInput = input.getElementsByTagName("input")[0];
    // Check if the input is rendered
    expect(input).toBeInTheDocument();
    // Check if the input is a password input
    expect(realInput).toHaveAttribute("type", "password");

    const showPassword = screen.getByTestId("VisibilityIcon");
    // Check that when the input is not focussed, the show password button is not visible
    expect(showPassword).not.toBeVisible();

    // Check that when the input is focussed, the show password button is visible
    fireEvent.click(input);
    expect(realInput).toHaveFocus();
    expect(showPassword).toBeInTheDocument();

    // Check that when the showPassword button is clicked, the input becomes a text input
    fireEvent.click(showPassword);
    expect(realInput).toHaveAttribute("type", "text");

    // Check that when the input is unfocused, the input is a password again and the showPassword button disappear
    fireEvent.blur(realInput);
    expect(realInput).toHaveAttribute("type", "password");
    expect(showPassword).not.toBeInTheDocument();
  });
});
