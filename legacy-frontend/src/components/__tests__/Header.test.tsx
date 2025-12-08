import theme from "@/app/theme";
import useUIStore from "@/stores/uiStore";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import Header from "../Header";

const mockedRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "",
      query: "",
      asPath: "",
      push: mockedRouterPush,
    };
  },
}));

describe("Header Component", () => {
  it("renders the Header component and its sub-components", async () => {
    render(
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>,
    );

    // Check if the language toggle button is rendered
    expect(
      await screen.findByTestId("language-toggle-button"),
    ).toBeInTheDocument();

    // Check if the Menu icon button is rendered
    expect(await screen.findByTestId("menu-toggle-button")).toBeInTheDocument();

    // Check if the logo is rendered
    expect(await screen.findByTestId("logo-image")).toBeInTheDocument();

    // Check if the user account button is rendered
    expect(
      await screen.findByTestId("user-account-button"),
    ).toBeInTheDocument();
  });

  it("handles the side navigation toggle", async () => {
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    render(
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>,
    );

    const menuButton = await screen.findByTestId("menu-toggle-button");
    fireEvent.click(menuButton);

    // Check if setSideNavOpen is called
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("opens the user menu when the user account button is clicked", async () => {
    render(
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>,
    );

    const userAccountButton = await screen.findByTestId("user-account-button");
    fireEvent.click(userAccountButton);

    // Check if the user menu is opened
    expect(await screen.findByTestId("user-menu")).toBeVisible();
  });
});
