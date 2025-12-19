import { InspectionData } from "@/utils/server/backend";
import { render, screen } from "@testing-library/react";
import InspectionElement from "../InspectionElement";

describe("InspectionElement", () => {
  const mockFinishedInspection: InspectionData = {
    label_info_id: "",
    id: "1",
    product_name: "Fertilizer 1",
    upload_date: new Date().toDateString(),
    verified: true,
  };
  const mockUnfinishedInspection: InspectionData = {
    label_info_id: "",
    id: "2",
    product_name: "Fertilizer 2",
    upload_date: new Date().toDateString(),
    verified: false,
  };

  const handleClick = jest.fn();

  it("renders an finished InspectionElement and check that all elements are present and that the error icon is not present", () => {
    render(
      <InspectionElement
        inspection={mockFinishedInspection}
        key={mockUnfinishedInspection.id}
        handleClick={() => {}}
      />,
    );
    expect(screen.getByText("Fertilizer 1")).toBeInTheDocument();
    expect(screen.getByTestId("image")).toBeInTheDocument();
    expect(screen.queryByTestId("error-icon")).not.toBeInTheDocument();
  });

  it("renders an unfinished InspectionElement and check that all elements are present and that the error icon is present", () => {
    render(
      <InspectionElement
        inspection={mockUnfinishedInspection}
        key={mockUnfinishedInspection.id}
        handleClick={() => {}}
      />,
    );
    expect(screen.getByText("Fertilizer 2")).toBeInTheDocument();
    expect(screen.getByTestId("image")).toBeInTheDocument();
    expect(screen.getByTestId("error-icon")).toBeInTheDocument();
  });

  it("clicks on the InspectionElement and check that the handleClick function has been called", () => {
    render(
      <InspectionElement
        inspection={mockFinishedInspection}
        key={mockUnfinishedInspection.id}
        handleClick={handleClick}
      />,
    );
    screen.getByText("Fertilizer 1").click();
    expect(handleClick).toHaveBeenCalled();
  });
});
