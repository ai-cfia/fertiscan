import LabelDataValidator from "@/components/LabelDataValidator";
import useLabelDataStore from "@/stores/labelDataStore";
import { DEFAULT_LABEL_DATA } from "@/types/types";
import { VERIFIED_LABEL_DATA } from "@/utils/client/constants";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { JSX, useState } from "react";

global.URL.createObjectURL = jest.fn(() => "mocked-url");

jest.mock("@/components/ImageViewer", () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-testid="mock-image-viewer">Mock Image Viewer</div>
  )),
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

// const mockUser = { username: "testUser" };
const mockFile = new File(["mock-content"], "file1.png", { type: "image/png" });
// const mockPath = "/mock/path/file1.png";
// const mockFileUploaded = FileUploaded.newFile(mockUser, mockPath, mockFile);
const mockFiles = [mockFile];

const Wrapper: React.FC<{
  children: (props: {
    labelData: typeof DEFAULT_LABEL_DATA;
    setLabelData: React.Dispatch<
      React.SetStateAction<typeof DEFAULT_LABEL_DATA>
    >;
  }) => JSX.Element;
  defaultLabelData?: typeof DEFAULT_LABEL_DATA;
}> = ({ children, defaultLabelData = DEFAULT_LABEL_DATA }) => {
  const [labelData, setLabelData] = useState(defaultLabelData);
  return children({ labelData, setLabelData });
};

describe("LabelDataValidator Rendering", () => {
  it("renders the container and main components", () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    expect(
      screen.getByTestId("label-data-validator-container"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
    expect(screen.getByTestId("mock-image-viewer")).toBeInTheDocument();
  });

  it("renders the correct step component initially", () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    expect(screen.getByTestId("base-information-form")).toBeInTheDocument();
    expect(screen.queryByTestId("organizations-form")).not.toBeInTheDocument();
  });
});

describe("LabelDataValidator Functionality", () => {
  it("navigates between steps using the stepper controls", () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const nextButton = screen.getByText("stepper.next");
    fireEvent.click(nextButton);

    expect(
      screen.queryByTestId("base-information-form"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("organizations-form")).toBeInTheDocument();

    const backButton = screen.getByText("stepper.back");
    fireEvent.click(backButton);

    expect(screen.getByTestId("base-information-form")).toBeInTheDocument();
    expect(screen.queryByTestId("organizations-form")).not.toBeInTheDocument();
  });

  it("does not navigate beyond the first or last step", () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const nextButton = screen.getByText("stepper.next");
    const backButton = screen.getByText("stepper.back");

    fireEvent.click(backButton);
    expect(screen.getByTestId("base-information-form")).toBeInTheDocument();

    for (let i = 0; i < 10; i++) {
      fireEvent.click(nextButton);
    }
    expect(screen.getByTestId("ingredients-form")).toBeInTheDocument();
  });

  it("renders the mocked Image Viewer", () => {
    render(
      <LabelDataValidator
        imageFiles={mockFiles}
        labelData={DEFAULT_LABEL_DATA}
        setLabelData={jest.fn()}
      />,
    );

    const imageViewer = screen.getByTestId("mock-image-viewer");
    expect(imageViewer).toBeInTheDocument();
  });
});

describe("LabelDataValidator and Forms Integration", () => {
  it("marks the Organizations step as Completed or Incomplete when fields are Verified", async () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const spans = screen.getAllByText("organizations.stepTitle", {
      exact: true,
    });
    const targetSpan = spans.find((span) =>
      span.classList.contains("MuiStepLabel-label"),
    );
    expect(targetSpan).not.toHaveClass("Mui-completed");
    const button = targetSpan!.closest("button");
    fireEvent.click(button!);

    const verifyAllButton = screen.getByTestId("verify-all-btn-0");
    fireEvent.click(verifyAllButton);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).toHaveClass("Mui-completed");

    fireEvent.click(
      screen.getByTestId("verified-icon-organizations.0.address.verified"),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).not.toHaveClass("Mui-completed");
  });

  it("marks the Base Information step as Completed or Incomplete when fields are Verified", async () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const spans = screen.getAllByText("baseInformation.stepTitle", {
      exact: true,
    });
    const targetSpan = spans.find((span) =>
      span.classList.contains("MuiStepLabel-label"),
    );
    expect(targetSpan).not.toHaveClass("Mui-completed");

    const button = targetSpan!.closest("button");
    await act(async () => {
      fireEvent.click(button!);
    });

    const verifyButtons = screen.getAllByTestId(
      /verified-icon-baseInformation/,
    );
    expect(verifyButtons.length).toBeGreaterThanOrEqual(7);

    for (const button of verifyButtons) {
      await act(async () => {
        fireEvent.click(button);
      });
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).toHaveClass("Mui-completed");

    await act(async () => {
      fireEvent.click(verifyButtons[0]);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).not.toHaveClass("Mui-completed");
  });

  it("marks the Cautions step as Completed or Incomplete when fields are Verified", async () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const spans = screen.getAllByText("cautions.stepTitle", {
      exact: true,
    });
    const targetSpan = spans.find((span) =>
      span.classList.contains("MuiStepLabel-label"),
    );
    expect(targetSpan).not.toHaveClass("Mui-completed");

    const button = targetSpan!.closest("button");
    await act(async () => {
      fireEvent.click(button!);
    });

    const verifyButtons = screen.getAllByTestId(/verify-row-btn-cautions-\d+/);
    expect(verifyButtons.length).toBeGreaterThanOrEqual(1);

    for (const button of verifyButtons) {
      await act(async () => {
        fireEvent.click(button);
      });
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    expect(targetSpan).toHaveClass("Mui-completed");

    await act(async () => {
      fireEvent.click(verifyButtons[0]);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).not.toHaveClass("Mui-completed");
  });

  it("marks the Instructions step as Completed or Incomplete when fields are Verified", async () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const spans = screen.getAllByText("instructions.stepTitle", {
      exact: true,
    });
    const targetSpan = spans.find((span) =>
      span.classList.contains("MuiStepLabel-label"),
    );
    expect(targetSpan).not.toHaveClass("Mui-completed");

    const button = targetSpan!.closest("button");
    await act(async () => {
      fireEvent.click(button!);
    });

    const verifyButtons = screen.getAllByTestId(
      /verify-row-btn-instructions-\d+/,
    );
    expect(verifyButtons.length).toBeGreaterThanOrEqual(1);

    for (const button of verifyButtons) {
      await act(async () => {
        fireEvent.click(button);
      });
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).toHaveClass("Mui-completed");

    await act(async () => {
      fireEvent.click(verifyButtons[0]);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).not.toHaveClass("Mui-completed");
  });

  it("marks the Guaranteed Analysis step as Completed or Incomplete when fields are Verified", async () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const spans = screen.getAllByText("guaranteedAnalysis.stepTitle", {
      exact: true,
    });
    const targetSpan = spans.find((span) =>
      span.classList.contains("MuiStepLabel-label"),
    );
    expect(targetSpan).not.toHaveClass("Mui-completed");

    const button = targetSpan!.closest("button");
    await act(async () => {
      fireEvent.click(button!);
    });

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("verified-icon-guaranteedAnalysis.titleEn.verified"),
      );
      fireEvent.click(
        screen.getByTestId("verified-icon-guaranteedAnalysis.titleFr.verified"),
      );
      fireEvent.click(
        screen.getByTestId(
          "verified-icon-guaranteedAnalysis.isMinimal.verified",
        ),
      );
      screen
        .getAllByTestId(/verify-row-btn-guaranteedAnalysis\.nutrients-\d+/)
        .forEach((btn) => fireEvent.click(btn));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).toHaveClass("Mui-completed");

    await act(async () => {
      fireEvent.click(
        screen.getByTestId("verified-icon-guaranteedAnalysis.titleEn.verified"),
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).not.toHaveClass("Mui-completed");
  });

  it("marks the Ingredients step as Completed or Incomplete when fields are Verified", async () => {
    render(
      <Wrapper>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const spans = screen.getAllByText("ingredients.stepTitle", {
      exact: true,
    });
    const targetSpan = spans.find((span) =>
      span.classList.contains("MuiStepLabel-label"),
    );
    expect(targetSpan).not.toHaveClass("Mui-completed");

    const button = targetSpan!.closest("button");
    await act(async () => {
      fireEvent.click(button!);
    });

    const verifyButtons = screen.getAllByTestId(
      /verify-row-btn-ingredients.nutrients-\d+/,
    );
    expect(verifyButtons.length).toBeGreaterThanOrEqual(1);

    await act(async () => {
      fireEvent.click(
        screen.getByTestId(
          "toggle-verified-btn-ingredients.recordKeeping.verified",
        ),
      );
      for (const button of verifyButtons) {
        fireEvent.click(button);
      }
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).toHaveClass("Mui-completed");

    await act(async () => {
      fireEvent.click(verifyButtons[0]);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(targetSpan).not.toHaveClass("Mui-completed");
  });

  it("stores the label data and navigates to the next page when the 'Submit' button is clicked", async () => {
    render(
      <Wrapper defaultLabelData={VERIFIED_LABEL_DATA}>
        {({ labelData, setLabelData }) => (
          <LabelDataValidator
            imageFiles={mockFiles}
            labelData={labelData}
            setLabelData={setLabelData}
          />
        )}
      </Wrapper>,
    );

    const submitButton = screen.getByText("stepper.submit");
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockedRouterPush).toHaveBeenCalledTimes(1);
    expect(useLabelDataStore.getState().labelData).toStrictEqual(
      VERIFIED_LABEL_DATA,
    );
    expect(mockedRouterPush).toHaveBeenCalledWith("/label-data-confirmation");
  });
});
