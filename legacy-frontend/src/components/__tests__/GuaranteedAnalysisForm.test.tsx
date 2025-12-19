import { DEFAULT_LABEL_DATA, LabelData } from "@/types/types";
import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import GuaranteedAnalysisForm from "../GuaranteedAnalysisForm";

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
      <GuaranteedAnalysisForm
        labelData={labelData}
        setLabelData={setLabelData}
      />
    </FormProvider>
  );
};

describe("GuaranteedAnalysisForm Rendering", () => {
  it("should render the title input fields and nutrients table", () => {
    render(<Wrapper initialData={DEFAULT_LABEL_DATA} />);

    expect(
      screen.getByTestId("verified-field-guaranteedAnalysis.titleEn"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("verified-field-guaranteedAnalysis.titleFr"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("verified-field-guaranteedAnalysis.isMinimal"),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("table-container-guaranteedAnalysis.nutrients"),
    ).toBeInTheDocument();
  });
});
