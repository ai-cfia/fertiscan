import theme from "@/app/theme";
import { beforeEach } from "@jest/globals";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import RouteGuard from "../RouteGuard";

describe("RouteGuard", () => {
  beforeEach(() => {
    Object.defineProperty(window.document, "cookie", {
      writable: true,
      value: "token=token; SameSite=Strict;",
    });
  });

  it("renders a RouteGuard component while having no token and check that the modal is present", () => {
    window.document.cookie = "";

    render(
      <ThemeProvider theme={theme}>
        <RouteGuard>
          <div></div>
        </RouteGuard>
      </ThemeProvider>,
    );
    expect(screen.getByTestId("route-guard-root")).toBeInTheDocument();
    // The modal should be present
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("renders a RouteGuard component while having a token and check that the modal is not present", () => {
    render(
      <ThemeProvider theme={theme}>
        <RouteGuard>
          <div></div>
        </RouteGuard>
      </ThemeProvider>,
    );
    // The modal should not be present
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });
});
