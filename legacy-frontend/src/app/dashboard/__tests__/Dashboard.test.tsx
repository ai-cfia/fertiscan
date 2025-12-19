import { screen, render } from "@testing-library/react";
import Dashboard from "@/app/dashboard/page";
import { Response } from "whatwg-fetch";
import axios from "axios";

// Mock useRouter:
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null,
    };
  },
}));

const mockInspectList = [
  {
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
  },
  {
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
  },
];

axios.get = jest.fn((path: string | URL | Request) => {
  if (path) {
    return Promise.resolve(
      new Response(mockInspectList, {
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
      }),
    );
  } else {
    return Promise.reject(
      new Response("", {
        status: 400,
        headers: new Headers({ "Content-Type": "application/json" }),
      }),
    );
  }
});

describe("Dashboard", () => {
  it("renders the dashboard", async () => {
    render(<Dashboard />);
    expect(screen.getByTestId("user-info")).toBeInTheDocument();
  });
});
