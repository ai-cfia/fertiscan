import { render, screen, fireEvent } from "@testing-library/react";
import SplitContentLayout from "../SplitContentLayout";

jest.mock("@/components/ImageViewer", () => jest.fn(() => <div data-testid="image-viewer" />));
jest.mock("@/components/inspection-details/ExpandButton", () => jest.fn(({ isRetracted, setIsRetracted }) => (
  <button data-testid="expand-button" onClick={() => setIsRetracted(!isRetracted)}>Toggle</button>
)));

describe("SplitContentLayout", () => {
  const defaultProps = {
    imageFiles: [new File([], "test.jpg")],
    header: <div data-testid="header">Header</div>,
    body: <div data-testid="body">Body</div>,
    footer: <div data-testid="footer">Footer</div>,
  };

  it("renders the layout correctly", () => {
    render(<SplitContentLayout {...defaultProps} />);

    expect(screen.getByTestId("main-content")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("body")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("image-viewer")).toBeInTheDocument();
  });

  it("renders topPanel when provided", () => {
    render(<SplitContentLayout {...defaultProps} topPanel={<div>Top Panel</div>} />);
    expect(screen.getByTestId("top-panel")).toBeInTheDocument();
  });

  it("renders bottomPanel when provided", () => {
    render(<SplitContentLayout {...defaultProps} bottomPanel={<div>Bottom Panel</div>} />);
    expect(screen.getByTestId("bottom-panel")).toBeInTheDocument();
  });

  it("toggles image viewer visibility when expandable", () => {
    render(<SplitContentLayout {...defaultProps} expandable />);

    const expandButton = screen.getByTestId("expand-button");
    expect(screen.getByTestId("image-viewer")).toBeInTheDocument();

    fireEvent.click(expandButton);
    expect(screen.queryByTestId("image-viewer")).not.toBeInTheDocument();

    fireEvent.click(expandButton);
    expect(screen.getByTestId("image-viewer")).toBeInTheDocument();
  });

  describe("Loading states", () => {
    it("shows loading indicator in ImageViewer when loadingImageViewer is true", () => {
      render(<SplitContentLayout {...defaultProps} loadingImageViewer />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByTestId("image-viewer-container")).toBeInTheDocument();
    });

    it("shows loading indicator in topPanel when loadingTopPanel is true", () => {
      render(
        <SplitContentLayout
          {...defaultProps}
          topPanel={<div data-testid="top-panel">Top Panel</div>}
          loadingTopPanel
        />,
      );
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByTestId("top-panel")).toBeInTheDocument();
    });

    it("shows loading indicator in right section when loadingRightSection is true", () => {
      render(<SplitContentLayout {...defaultProps} loadingRightSection />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByTestId("main-content")).toBeInTheDocument();
    });

    it("shows loading indicator in bottomPanel when loadingBottomPanel is true", () => {
      render(
        <SplitContentLayout
          {...defaultProps}
          bottomPanel={<div data-testid="bottom-panel">Bottom Panel</div>}
          loadingBottomPanel
        />,
      );
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByTestId("bottom-panel")).toBeInTheDocument();
    });
  });
});
