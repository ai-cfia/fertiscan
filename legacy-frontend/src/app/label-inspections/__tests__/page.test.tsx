import { RegistrationType } from "@/types/types";
import {
  CONFIRMED_LABEL_DATA,
  VERIFIED_LABEL_DATA_WITH_ID,
} from "@/utils/client/constants";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import InspectionPage from "../[id]/page";

jest.mock("../../../components/ImageViewer", () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-testid="image-viewer-mock">Mock ImageViewer</div>
  )),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({ id: "123" })),
}));

jest.mock("axios");

jest.mock("react-i18next", () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}));

describe("InspectionPage", () => {
  let mockRouter: { push: jest.Mock };

  beforeEach(() => {
    mockRouter = { push: jest.fn() };

    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    jest.clearAllMocks();
  });

  it("renders all inspection data", async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: VERIFIED_LABEL_DATA_WITH_ID,
    });

    render(<InspectionPage />);

    await waitFor(() =>
      expect(
        screen.getByText(VERIFIED_LABEL_DATA_WITH_ID.inspectionId),
      ).toBeInTheDocument(),
    );

    Object.values(VERIFIED_LABEL_DATA_WITH_ID.baseInformation).forEach(
      (field) => {
        if (typeof field === "object" && "value" in field) {
          expect(screen.getByText(field.value)).toBeInTheDocument();
        }
      },
    );

    VERIFIED_LABEL_DATA_WITH_ID.baseInformation.registrationNumbers.values.forEach(
      ({ identifier, type }) =>
        expect(
          screen.getByText(
            `${identifier} (baseInformation.regType.${type === RegistrationType.FERTILIZER ? "fertilizer" : "ingredient"})`,
          ),
        ).toBeInTheDocument(),
    );

    VERIFIED_LABEL_DATA_WITH_ID.cautions.forEach(({ en }) => {
      expect(screen.getByText(en)).toBeInTheDocument();
    });

    VERIFIED_LABEL_DATA_WITH_ID.instructions.forEach(({ en }) => {
      expect(screen.getByText(en)).toBeInTheDocument();
    });

    VERIFIED_LABEL_DATA_WITH_ID.guaranteedAnalysis.nutrients.forEach(
      ({ en, value, unit }) => {
        expect(screen.queryAllByText(en).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(value!).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(unit!).length).toBeGreaterThan(0);
      },
    );

    VERIFIED_LABEL_DATA_WITH_ID.ingredients.nutrients.forEach(
      ({ en, value, unit }) => {
        expect(screen.queryAllByText(en).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(value!).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(unit!).length).toBeGreaterThan(0);
      },
    );
  });

  // it("handles API error and displays error page", async () => {
  //   (axios.get as jest.Mock).mockRejectedValue({ response: { status: 404 } });

  //   render(<InspectionPage />);

  //   await waitFor(() => expect(screen.getByText("404")).toBeInTheDocument());
  // });

  it("redirects to edit page on edit click", async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: VERIFIED_LABEL_DATA_WITH_ID,
    });

    render(<InspectionPage />);
    await waitFor(() =>
      expect(
        screen.getByText(VERIFIED_LABEL_DATA_WITH_ID.inspectionId),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("edit-button"));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/label-data-validation/${VERIFIED_LABEL_DATA_WITH_ID.inspectionId}`,
    );
  });

  it("opens confirmation dialog when discard button is clicked", async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: VERIFIED_LABEL_DATA_WITH_ID,
    });

    render(<InspectionPage />);
    await waitFor(() =>
      expect(
        screen.getByText(VERIFIED_LABEL_DATA_WITH_ID.inspectionId),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("discard-button"));
    expect(screen.getByText("confirmDiscardMessage")).toBeInTheDocument();
  });

  it("confirms discard and calls delete API", async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: VERIFIED_LABEL_DATA_WITH_ID,
    });
    (axios.delete as jest.Mock).mockResolvedValue({});

    render(<InspectionPage />);
    await waitFor(() =>
      expect(
        screen.getByText(VERIFIED_LABEL_DATA_WITH_ID.inspectionId),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("discard-button"));

    await waitFor(() =>
      expect(screen.getByText("confirmDiscardMessage")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() => expect(axios.delete).toHaveBeenCalled());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/"));
  });

  it("cancels discard and does not call delete API", async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: VERIFIED_LABEL_DATA_WITH_ID,
    });

    render(<InspectionPage />);
    await waitFor(() =>
      expect(
        screen.getByText(VERIFIED_LABEL_DATA_WITH_ID.inspectionId),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("discard-button"));

    await waitFor(() =>
      expect(screen.getByText("confirmDiscardMessage")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("cancel"));

    expect(axios.delete).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(
        screen.queryByText("confirmDiscardMessage"),
      ).not.toBeInTheDocument(),
    );
  });

  it("handles delete API failure correctly", async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: VERIFIED_LABEL_DATA_WITH_ID,
    });
    (axios.delete as jest.Mock).mockRejectedValue(new Error("Delete failed"));

    render(<InspectionPage />);
    await waitFor(() =>
      expect(
        screen.getByText(VERIFIED_LABEL_DATA_WITH_ID.inspectionId),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("discard-button"));

    await waitFor(() =>
      expect(screen.getByText("confirmDiscardMessage")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() => expect(axios.delete).toHaveBeenCalled());

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("disables edit and discard buttons when inspection is confirmed", async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: CONFIRMED_LABEL_DATA,
    });

    render(<InspectionPage />);
    await waitFor(() =>
      expect(
        screen.getByText(CONFIRMED_LABEL_DATA.inspectionId),
      ).toBeInTheDocument(),
    );

    const editButton = screen.getByTestId("edit-button");
    const discardButton = screen.getByTestId("discard-button");

    expect(editButton).toBeDisabled();
    expect(discardButton).toBeDisabled();
  });
});
