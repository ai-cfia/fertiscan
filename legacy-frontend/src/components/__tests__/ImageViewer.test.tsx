import theme from "@/app/theme";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import ImageViewer from "@/components/ImageViewer";

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("ImageViewer Component", () => {
  const mockImageFiles = [
    new File([""], "image1", { type: "image/png" }),
    new File([""], "image2", { type: "image/png" }),
  ];

  global.URL.createObjectURL = jest.fn();

  it("renders the ImageViewer component and its sub-components", () => {
    render(
      <ThemeProvider theme={theme}>
        <ImageViewer imageFiles={mockImageFiles} />
      </ThemeProvider>,
    );
    // Check if the Swiper is rendered
    expect(screen.getByTestId("swiper")).toBeInTheDocument();
    // Check if all the slides are rendered
    expect(screen.getAllByTestId(/^slide-\d+/)).toHaveLength(2);
    // Check if all images are rendered
    expect(screen.getAllByTestId(/image-slide-\d+/)).toHaveLength(2);
    // Check if the controls are rendered
    expect(screen.getByTestId("prev-button")).toBeInTheDocument();
    expect(screen.getByTestId("next-button")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-in-button")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-out-button")).toBeInTheDocument();
    expect(screen.getByTestId("reset-button")).toBeInTheDocument();
  });
});
