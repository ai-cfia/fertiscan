import { DEFAULT_LABEL_DATA, LabelData } from "@/types/types";
import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import InstructionsForm from "../InstructionsForm";

const Wrapper = ({
  initialData,
  onStateChange,
}: {
  initialData: LabelData;
  onStateChange?: (data: LabelData) => void;
}) => {
  const [labelData, setLabelData] = useState(initialData);
  const methods = useForm({
    defaultValues: labelData,
  });

  useEffect(() => {
    if (onStateChange) {
      onStateChange(labelData);
    }
  }, [labelData, onStateChange]);

  return (
    <FormProvider {...methods}>
      <InstructionsForm labelData={labelData} setLabelData={setLabelData} />
    </FormProvider>
  );
};

describe("InstructionsForm Rendering", () => {
  it("should render the VerifiedBilingualTable for instructions", () => {
    render(<Wrapper initialData={DEFAULT_LABEL_DATA} />);

    expect(screen.getByTestId("instructions-form")).toBeInTheDocument();
    expect(screen.getByTestId("table-container-instructions")).toBeInTheDocument();
  });
});
