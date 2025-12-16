import { act, render, screen } from "@testing-library/react";
import LabelDataValidationPage from "../page";

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

jest.mock("@/components/ImageViewer", () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-testid="mock-image-viewer">Mock Image Viewer</div>
  )),
}));

describe("LabelDataValidationPage Rendering", () => {
  it("renders the LabelDataValidator component", () => {
    act(() => {
      render(<LabelDataValidationPage />);
    });
    expect(
      screen.getByTestId("label-data-validator-container"),
    ).toBeInTheDocument();
  });
});
