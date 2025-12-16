import { render, screen } from "@testing-library/react";

import i18n from "@/app/i18n";
import InspectionList from "../InspectionList";

// Mock useRouter:
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null,
    };
  },
}));

const mockFinishedInspection = {
  company_info_id: "",
  company_name: "test_company",
  label_info_id: "",
  manufacturer_info_id: "test_manufacturer",
  picture_set_id: "",
  sample_id: "",
  id: "1",
  product_name: "Fertilizer 1",
  upload_date: new Date().toDateString(),
  updated_at: new Date(new Date().getDate() + 5).toDateString(),
};
const mockUnfinishedInspection = {
  company_info_id: "",
  company_name: "test_company",
  label_info_id: "",
  manufacturer_info_id: "test_manufacturer",
  picture_set_id: "",
  sample_id: "",
  id: "2",
  product_name: "Fertilizer 2",
  upload_date: new Date().toDateString(),
  updated_at: new Date().toDateString(),
};

describe("InspectionList", () => {
  beforeEach(() => {
    i18n.init();
  });

  it("renders an InspectionList component and check that the inspection elements are present", async () => {
    render(
      <InspectionList
        search=""
        inspectionList={[mockFinishedInspection, mockUnfinishedInspection]}
      />,
    );
    await new Promise((r) => setTimeout(r, 1000));
    expect(screen.getByText("Fertilizer 1")).toBeInTheDocument();
    expect(screen.getByText("Fertilizer 2")).toBeInTheDocument();
  });

  it("renders an InspectionList component with a search and check that only the searched inspection elements are present", async () => {
    render(
      <InspectionList
        search="1"
        inspectionList={[mockFinishedInspection, mockUnfinishedInspection]}
      />,
    );
    await new Promise((r) => setTimeout(r, 1000));
    expect(screen.getByText("Fertilizer 1")).toBeInTheDocument();
    expect(screen.queryByText("Fertilizer 2")).not.toBeInTheDocument();
  });
});
