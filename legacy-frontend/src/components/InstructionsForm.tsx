import { FormComponentProps, LabelData } from "@/types/types";
import useDebouncedSave from "@/utils/client/useDebouncedSave";
import { Box } from "@mui/material";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import VerifiedBilingualTable from "./VerifiedBilingualTable";

/**
 * InstructionsForm component.
 * Renders a page of the form for entering instruction information of a label with debounced save functionality.
 *
 * @param {FormComponentProps} props - The properties passed to this component.
 * @param {boolean} [props.loading=false] - Determines if loading state is active (disabling fields).
 * @param {LabelData} props.labelData - The label data being edited in this form page.
 * @param {React.Dispatch<React.SetStateAction<LabelData>>} props.setLabelData - Function to update label data.
 * @returns {JSX.Element} The rendered InstructionsForm component.
 */
const InstructionsForm: React.FC<FormComponentProps> = ({
  labelData,
  setLabelData,
  loading = false,
}) => {
  const methods = useForm<LabelData>({
    defaultValues: labelData,
  });
  const sectionName = "instructions";

  // Watch the instruction information section to react to changes
  const watchedInstructions = useWatch({
    control: methods.control,
    name: sectionName,
  });

  // Setup debounced save function
  const save = useDebouncedSave(setLabelData);

  // Update form values when labelData props change
  useEffect(() => {
    const currentValues = methods.getValues();
    if (JSON.stringify(currentValues) !== JSON.stringify(labelData)) {
      methods.reset(labelData);
    }
  }, [labelData, methods]);

  // Trigger debounced save function when watched instruction information changes
  useEffect(() => {
    save(sectionName, watchedInstructions);
  }, [watchedInstructions, save]);

  return (
    <FormProvider {...methods}>
      <Box className="p-4" data-testid="instructions-form">
        <VerifiedBilingualTable path={sectionName} loading={loading} isFocus={true} />
      </Box>
    </FormProvider>
  );
};

export default InstructionsForm;
