import { Quantity } from "@/types/types";
import { render, screen } from "@testing-library/react";
import { QuantityChips } from "../QuantityChips";

describe("QuantityChips", () => {
  it("renders valid quantities, filters out invalid values", () => {
    const quantities: Quantity[] = [
      { value: "5", unit: "kg" },
      { value: "", unit: "g" },
      { value: "0", unit: "kg" },
    ];

    render(<QuantityChips quantities={quantities} />);

    expect(screen.getByText("5 kg")).toBeInTheDocument();
    expect(screen.getByText("0 kg")).toBeInTheDocument();
    expect(screen.queryByText("g")).not.toBeInTheDocument();
  });
});
