/* eslint-disable react-hooks/rules-of-hooks */
import useUIStore from "@/stores/uiStore";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import SideNav from "../Sidenav";
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}));

const theme = createTheme();
const { t } = useTranslation("header");

describe("SideNav Component", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  it("should render the SideNav component", () => {
    render(
      <ThemeProvider theme={theme}>
        <SideNav />
      </ThemeProvider>,
    );

    expect(screen.getByText(t("sideNav.FertiScan"))).toBeInTheDocument();
    expect(screen.getByText(t("sideNav.newInspection"))).toBeInTheDocument();
    expect(screen.getByText(t("sideNav.searchPage"))).toBeInTheDocument();
    expect(screen.getByText(t("sideNav.repportIssue"))).toBeInTheDocument();
  });

  it("should close the sidebar when clicking on any drawer button", () => {
    useUIStore.getState().openSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    render(
      <ThemeProvider theme={theme}>
        <SideNav />
      </ThemeProvider>,
    );

    const newInspectionButton = screen.getByTestId("new-inspection-button");
    fireEvent.click(newInspectionButton);
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().openSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    const searchPageButton = screen.getByTestId("search-page-button");
    fireEvent.click(searchPageButton);
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().openSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    const reportIssueButton = screen.getByTestId("report-issue-button");
    fireEvent.click(reportIssueButton);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("should call onClose when clicking outside the drawer", () => {
    useUIStore.getState().openSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    render(
      <ThemeProvider theme={theme}>
        <SideNav />
      </ThemeProvider>,
    );

    const drawer = screen.getByTestId("backdrop");
    fireEvent.click(drawer);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("should have correct links", () => {
    render(
      <ThemeProvider theme={theme}>
        <SideNav />
      </ThemeProvider>,
    );

    expect(
      screen.getByText(t("sideNav.newInspection")).closest("a"),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByText(t("sideNav.searchPage")).closest("a"),
    ).toHaveAttribute("href", "/SearchPage");
    expect(
      screen.getByText(t("sideNav.repportIssue")).closest("a"),
    ).toHaveAttribute("href");
  });

  it("should navigate to '/' when 'new inspection' is clicked", () => {
    const router = useRouter();
    render(
      <ThemeProvider theme={theme}>
        <SideNav />
      </ThemeProvider>,
    );

    const newInspectionButton = screen.getByTestId("new-inspection-button");
    fireEvent.click(newInspectionButton);

    expect(router.push).toHaveBeenCalledWith("/");
  });
});
