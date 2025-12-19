import { DEFAULT_LABEL_DATA, LabelData } from "@/types/types";
import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import BaseInformationForm from "../BaseInformationForm";

const Wrapper = ({
  initialData,
  onStateChange,
}: {
  initialData: LabelData;
  onStateChange?: (data: LabelData) => void;
}) => {
  const [labelData, setLabelData] = useState<LabelData>(initialData);
  const methods = useForm<LabelData>({
    defaultValues: labelData,
  });

  useEffect(() => {
    if (onStateChange) {
      onStateChange(labelData);
    }
  }, [labelData, onStateChange]);

  return (
    <FormProvider {...methods}>
      <BaseInformationForm labelData={labelData} setLabelData={setLabelData} />
    </FormProvider>
  );
};

describe("BaseInformationForm Rendering", () => {
  it("should render all fields with correct components", () => {
    render(<Wrapper initialData={DEFAULT_LABEL_DATA} />);

    const verifiedFields = ["name", "lotNumber", "npk"];
    const verifiedLists = ["registrationNumbers", "weight", "density", "volume"];

    verifiedFields.forEach((key) => {
      const verifiedInput = screen.getByTestId(
        `verified-field-baseInformation.${key}`,
      );
      expect(verifiedInput).toBeInTheDocument();
    });

    verifiedLists.forEach((key) => {
      const quantityInput = screen.getByTestId(
        `fields-container-baseInformation.${key}`,
      );
      expect(quantityInput).toBeInTheDocument();
    });
  });
});
