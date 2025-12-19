import useBreakpoints from "@/utils/client/useBreakpoints";
import { fireEvent, render, screen } from "@testing-library/react";
import ExpandButton from "../ExpandButton";

jest.mock("@/utils/client/useBreakpoints", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isDownXs: false,
    isBetweenXsSm: false,
    isBetweenSmMd: false,
    isBetweenMdLg: false,
  })),
}));

describe("ExpandButton", () => {
  const mockSetIsRetracted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("toggles state when clicked", () => {
    render(
      <ExpandButton isRetracted={true} setIsRetracted={mockSetIsRetracted} />,
    );

    fireEvent.click(screen.getByTestId("retract-button"));
    expect(mockSetIsRetracted).toHaveBeenCalledWith(false);
  });

  it.each([
    [true, true, "rotate-90"],
    [false, true, "rotate-270"],
    [true, false, "rotate-0"],
    [false, false, "rotate-180"],
  ])(
    "applies correct rotation when isRetracted=%s and isSmallScreen=%s",
    (isRetracted, isSmallScreen, rotation) => {
      (useBreakpoints as jest.Mock).mockReturnValue({
        isDownXs: isSmallScreen,
      });
      render(
        <ExpandButton isRetracted={isRetracted} setIsRetracted={() => {}} />,
      );
      expect(screen.getByTestId("expand-icon")).toHaveClass(rotation);
    },
  );
});
