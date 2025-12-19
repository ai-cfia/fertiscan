import { usePlaceholder } from "@/classes/User";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";
import UserMenu from "../UserMenu";

const theme = createTheme();
jest.mock("../../classes/User", () => ({
  usePlaceholder: jest.fn(),
}));

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

const dummyUser = {
  getUsername: jest.fn().mockReturnValue("placeholderUser"),
};

(usePlaceholder as jest.Mock).mockReturnValue(dummyUser);

describe("UserMenu", () => {
  const mocksetIsUserMenuOpen = jest.fn();
  const mockSetAnchorElement = jest.fn();
  let anchorElement: HTMLElement | null = null;

  beforeEach(() => {
    // Reset the mock function calls before each test
    mocksetIsUserMenuOpen.mockReset();
    mockSetAnchorElement.mockReset();
    anchorElement = document.createElement("div"); // Create a new div element to be used as an anchor
  });

  it("renders without crashing", () => {
    render(
      <ThemeProvider theme={theme}>
        <UserMenu
          anchorElement={anchorElement}
          isUserMenuOpen={false}
          setIsUserMenuOpen={mocksetIsUserMenuOpen}
          setAnchorElement={mockSetAnchorElement}
        />
      </ThemeProvider>,
    );
  });

  it("is not visible when isUserMenuOpen is false", () => {
    render(
      <ThemeProvider theme={theme}>
        <UserMenu
          anchorElement={anchorElement}
          isUserMenuOpen={false}
          setIsUserMenuOpen={mocksetIsUserMenuOpen}
          setAnchorElement={mockSetAnchorElement}
        />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId("user-menu")).not.toBeVisible();
  });

  it("is visible when isUserMenuOpen is true", () => {
    render(
      <ThemeProvider theme={theme}>
        <UserMenu
          anchorElement={anchorElement}
          isUserMenuOpen={true}
          setIsUserMenuOpen={mocksetIsUserMenuOpen}
          setAnchorElement={mockSetAnchorElement}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("user-menu")).toBeVisible();
  });

  it("closes when a MenuItem is clicked", () => {
    render(
      <ThemeProvider theme={theme}>
        <UserMenu
          anchorElement={anchorElement}
          isUserMenuOpen={true}
          setIsUserMenuOpen={mocksetIsUserMenuOpen}
          setAnchorElement={mockSetAnchorElement}
        />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByTestId("dashboard-menu-item"));
    expect(mocksetIsUserMenuOpen).toHaveBeenCalledWith(false);
    expect(mockSetAnchorElement).toHaveBeenCalledWith(null);
  });

  it("renders the sub components", () => {
    render(
      <ThemeProvider theme={theme}>
        <UserMenu
          anchorElement={anchorElement}
          isUserMenuOpen={true}
          setIsUserMenuOpen={mocksetIsUserMenuOpen}
          setAnchorElement={mockSetAnchorElement}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("dashboard-menu-item")).toBeVisible();
    expect(screen.getByTestId("profile-menu-item")).toBeVisible();
    expect(screen.getByTestId("logout-menu-item")).toBeVisible();
    expect(screen.getByTestId("app-version")).toBeVisible();
  });
});
