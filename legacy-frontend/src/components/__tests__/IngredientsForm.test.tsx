import { DEFAULT_LABEL_DATA, LabelData } from "@/types/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import IngredientsForm from "../IngredientsForm";

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
      <IngredientsForm labelData={labelData} setLabelData={setLabelData} />
    </FormProvider>
  );
};

describe("IngredientsForm Rendering", () => {
  it("should render the title input fields and nutrients table", () => {
    render(<Wrapper initialData={DEFAULT_LABEL_DATA} />);
    expect(
      screen.getByTestId("verified-field-ingredients.recordKeeping"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ingredients-form")).toBeInTheDocument();
    expect(
      screen.getByTestId("table-container-ingredients.nutrients"),
    ).toBeInTheDocument();
  });

  it("should not render the nutrient section when record-keeping is set to yes, then render it again when set to no", () => {
    render(<Wrapper initialData={DEFAULT_LABEL_DATA} />);
    fireEvent.click(
      screen.getByTestId("radio-yes-field-ingredients.recordKeeping.value"),
    );

    expect(
      screen.queryByTestId("table-container-ingredients.nutrients"),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId("radio-no-field-ingredients.recordKeeping.value"),
    );

    expect(
      screen.getByTestId("table-container-ingredients.nutrients"),
    ).toBeInTheDocument();
  });
});
