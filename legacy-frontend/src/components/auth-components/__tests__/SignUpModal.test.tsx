import theme from "@/app/theme";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import SignUpModal from "../SignUpModal";

describe("SignUpModal", () => {
  const mockErrorSignup = jest.fn(
    async (username: string, password: string, confirm: string) => {
      console.log(username.slice(0, 0));
      console.log(password.slice(0, 0));
      console.log(confirm.slice(0, 0));
      return "Error";
    },
  );
  const mockChangeMode = jest.fn();

  it("renders a SignUpModal component and check that the signup features and only them are present", () => {
    render(
      <ThemeProvider theme={theme}>
        <SignUpModal
          isOpen={true}
          signup={() => new Promise(() => "")}
          onChangeMode={() => {}}
        />
      </ThemeProvider>,
    );
    // The title should be present and be Sign Up
    expect(screen.getByTestId("modal-title")).toBeInTheDocument();
    expect(screen.getByTestId("modal-title")).toHaveTextContent("signup.title");
    // The username input should be present
    expect(screen.getByTestId("modal-username")).toBeInTheDocument();
    // The password input should be present
    expect(screen.getByTestId("modal-password")).toBeInTheDocument();
    // The confirm password should be present
    expect(screen.getByTestId("modal-confirm-password")).toBeInTheDocument();
    // The check box should be present
    expect(screen.getByTestId("modal-reminder")).toBeInTheDocument();
    // The submit button should be present
    expect(screen.getByTestId("modal-submit")).toBeInTheDocument();
    // The submit button should have the text "Sign Up"
    expect(screen.getByTestId("modal-submit")).toHaveTextContent(
      "signup.title",
    );
    // The submit button should be disabled
    expect(screen.getByTestId("modal-submit")).toBeDisabled();
    // The signup text should be present
    expect(screen.getByTestId("modal-change")).toBeInTheDocument();
    // The signup text should have the text "Login"
    expect(screen.getByTestId("modal-change")).toHaveTextContent(
      "signup.switchTextsignup.switchLink",
    );
  });

  it("renders a SignUpModal component, clicks on the Login text then check that the change function has been called", () => {
    render(
      <ThemeProvider theme={theme}>
        <SignUpModal
          isOpen={true}
          signup={() => new Promise(() => "")}
          onChangeMode={mockChangeMode}
        />
      </ThemeProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByTestId("modal-change-button"));
    });
    expect(mockChangeMode).toHaveBeenCalled();
  });

  it("renders a SignUpModal component, fills the inputs and clicks on the submit button then check that the signup function has been called", async () => {
    render(
      <ThemeProvider theme={theme}>
        <SignUpModal
          isOpen={true}
          signup={mockErrorSignup}
          onChangeMode={() => {}}
        />
      </ThemeProvider>,
    );
    fireEvent.change(
      screen.getByTestId("modal-username").getElementsByTagName("input")[0],
      { target: { value: "test" } },
    );
    // Fill the password input
    fireEvent.change(
      screen.getByTestId("modal-password").getElementsByTagName("input")[0],
      { target: { value: "password" } },
    );
    // Fill the confirm password input
    fireEvent.change(
      screen
        .getByTestId("modal-confirm-password")
        .getElementsByTagName("input")[0],
      { target: { value: "password" } },
    );
    fireEvent.click(screen.getByTestId("modal-reminder"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("modal-submit"));
      await new Promise((r) => setTimeout(r, 200)); //! forced to wait for update !
    });
    expect(mockErrorSignup).toHaveBeenCalled();
    expect(screen.getByTestId("modal-error-message")).toBeInTheDocument();
  });
});
