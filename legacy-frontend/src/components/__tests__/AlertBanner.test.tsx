import useAlertStore from "@/stores/alertStore";
import { Button } from "@mui/material";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AlertBanner from "../AlertBanner";

const AUTO_DISMISS_TIME =
  Number(process.env.NEXT_PUBLIC_ALERT_BANNER_AUTO_DISMISS_TIME) || 5000;

const AlertWrapper: React.FC = () => {
  const { showAlert } = useAlertStore();

  const handleClick = () => {
    showAlert("Test alert message", "success");
  };

  return (
    <div>
      <Button data-testid="trigger-alert-button" onClick={handleClick}>
        Show Alert
      </Button>
      <AlertBanner />
    </div>
  );
};

describe("AlertBanner", () => {
  beforeEach(() => {
    act(() => {
      useAlertStore.setState({
        alert: { message: "Test alert", type: "success" },
      });
    });
  });

  afterEach(() => {
    act(() => {
      useAlertStore.setState({ alert: null });
    });
  });

  it("renders the alert banner when alert is present", () => {
    render(<AlertBanner />);
    expect(screen.getByText("Test alert")).toBeInTheDocument();
  });

  it("does not render the alert banner when alert is absent", () => {
    act(() => {
      useAlertStore.setState({ alert: null });
    });
    render(<AlertBanner />);
    expect(screen.queryByText("Test alert")).not.toBeInTheDocument();
  });

  it("displays the correct alert message", () => {
    render(<AlertBanner />);
    expect(screen.getByText("Test alert")).toBeInTheDocument();
  });

  it("applies the correct alert type severity", () => {
    render(<AlertBanner />);
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardSuccess");
  });

  it("auto-dismisses the alert after AUTO_DISMISS_TIME", () => {
    jest.useFakeTimers();
    render(<AlertBanner />);
    act(() => jest.advanceTimersByTime(AUTO_DISMISS_TIME - 1000));
    expect(useAlertStore.getState().alert).not.toBeNull();
    act(() => jest.advanceTimersByTime(1000));
    expect(useAlertStore.getState().alert).toBeNull();
    jest.useRealTimers();
  });

  it("pauses auto-dismiss on mouse enter", () => {
    jest.useFakeTimers();
    render(<AlertBanner />);
    const alert = screen.getByRole("alert");
    fireEvent.mouseEnter(alert);
    act(() => jest.advanceTimersByTime(AUTO_DISMISS_TIME));
    expect(useAlertStore.getState().alert).not.toBeNull();
    jest.useRealTimers();
  });

  it("resumes auto-dismiss on mouse leave", () => {
    jest.useFakeTimers();
    render(<AlertBanner />);
    const alert = screen.getByRole("alert");
    fireEvent.mouseEnter(alert);
    fireEvent.mouseLeave(alert);
    act(() => jest.advanceTimersByTime(AUTO_DISMISS_TIME));
    expect(useAlertStore.getState().alert).toBeNull();
    jest.useRealTimers();
  });

  it("executes hideAlert on close button click", () => {
    render(<AlertBanner />);
    fireEvent.click(screen.getByRole("button"));
    expect(useAlertStore.getState().alert).toBeNull();
  });

  it("should display the alert banner when showAlert is used", async () => {
    render(<AlertWrapper />);

    const button = screen.getByTestId("trigger-alert-button");
    fireEvent.click(button);

    const alert = await waitFor(() => screen.getByTestId("alert-banner"));

    expect(alert).toBeInTheDocument();
    expect(screen.getByTestId("alert-message")).toHaveTextContent(
      "Test alert message",
    );
  });
});
