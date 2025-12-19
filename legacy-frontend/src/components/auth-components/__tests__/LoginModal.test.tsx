import theme from "@/app/theme";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import LoginModal from "../LoginModal";

describe("LoginModal", () => {
  const mockErrorLogin = jest.fn(async (username: string, password: string) => {
    console.log(username.slice(0, 0));
    console.log(password.slice(0, 0));
    return "Error";
  });

  const mockChangeMode = jest.fn();

  it("renders a LoginModal component and check that the login features and only them are present", () => {
    render(
      <ThemeProvider theme={theme}>
        <LoginModal
          isOpen={true}
          login={() => new Promise(() => "")}
          onChangeMode={() => {}}
        />
      </ThemeProvider>,
    );
    // The title should be present and be Login
    expect(screen.getByTestId("modal-title")).toBeInTheDocument();
    expect(screen.getByTestId("modal-title")).toHaveTextContent("login.title");
    // The username input should be present
    expect(screen.getByTestId("modal-username")).toBeInTheDocument();
    // The password input should be present
    expect(screen.getByTestId("modal-password")).toBeInTheDocument();
    // The confirm password should not be present
    expect(
      screen.queryByTestId("modal-confirm-password"),
    ).not.toBeInTheDocument();
    // The check box should not be present
    expect(screen.queryByTestId("modal-reminder")).not.toBeInTheDocument();
    // The submit button should be present
    expect(screen.getByTestId("modal-submit")).toBeInTheDocument();
    // The submit button should have the text "Login"
    expect(screen.getByTestId("modal-submit")).toHaveTextContent("login.title");
    // The submit button should be disabled
    expect(screen.getByTestId("modal-submit")).toBeDisabled();
    // The signup text should be present
    expect(screen.getByTestId("modal-change")).toBeInTheDocument();
    // The signup text should have the text "Sign Up"
    expect(screen.getByTestId("modal-change")).toHaveTextContent(
      "login.switchTextlogin.switchLink",
    );
  });

  it("renders a LoginModal component, clicks on the Sign Up text then check that the change function has been called", () => {
    render(
      <ThemeProvider theme={theme}>
        <LoginModal
          isOpen={true}
          login={() => new Promise(() => "")}
          onChangeMode={mockChangeMode}
        />
      </ThemeProvider>,
    );
    // Click on the Sign Up text
    fireEvent.click(screen.getByTestId("modal-change-button"));
    // Check that the change function has been called
    expect(mockChangeMode).toHaveBeenCalled();
  });

  it("renders a LoginModal component, fills the username and password inputs then check that the submit button is enabled", () => {
    render(
      <ThemeProvider theme={theme}>
        <LoginModal
          isOpen={true}
          login={() => new Promise(() => "")}
          onChangeMode={() => {}}
        />
      </ThemeProvider>,
    );
    // Fill the username input
    fireEvent.change(
      screen.getByTestId("modal-username").getElementsByTagName("input")[0],
      { target: { value: "test" } },
    );
    // Fill the password input
    fireEvent.change(
      screen.getByTestId("modal-password").getElementsByTagName("input")[0],
      { target: { value: "password" } },
    );
    // Check that the submit button is enabled
    expect(screen.getByTestId("modal-submit")).not.toBeDisabled();
  });

  it("renders a LoginModal component, fills the username and password inputs then click on the submit button", async () => {
    render(
      <ThemeProvider theme={theme}>
        <LoginModal
          isOpen={true}
          login={mockErrorLogin}
          onChangeMode={() => {}}
        />
      </ThemeProvider>,
    );
    // Fill the username input
    fireEvent.change(
      screen.getByTestId("modal-username").getElementsByTagName("input")[0],
      { target: { value: "test" } },
    );
    // Fill the password input
    fireEvent.change(
      screen.getByTestId("modal-password").getElementsByTagName("input")[0],
      { target: { value: "password" } },
    );
    // Click on the submit button
    await act(async () => {
      fireEvent.click(screen.getByTestId("modal-submit"));
      // Check that the mock function is called
      await new Promise((r) => setTimeout(r, 200)); //! forced to wait for update !
    });
    // Check that the login function has been called
    expect(mockErrorLogin).toHaveBeenCalled();
    // Check that the text of the error message is present
    expect(screen.getByTestId("modal-error-message")).toBeInTheDocument();
  });
});
