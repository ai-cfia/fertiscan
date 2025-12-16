import { FormComponentProps, LabelData } from "@/types/types";
import useDebouncedSave from "@/utils/client/useDebouncedSave";
import { Box } from "@mui/material";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import VerifiedBilingualTable from "./VerifiedBilingualTable";

/**
 * CautionsForm component.
 * Renders a page of the form for entering cautions information of a label with debounced save functionality.
 *
 * @param {Object} props - The component props.
 * @param {LabelData} props.labelData - The initial data for the form.
 * @param {Function} props.setLabelData - The function to update the label data.
 * @param {boolean} [props.loading=false] - The loading state to indicate if the form is in a loading state.
 * @returns {JSX.Element} The rendered CautionsForm component.
 */
const CautionsForm: React.FC<FormComponentProps> = ({
  labelData,
  setLabelData,
  loading = false,
}) => {
  const methods = useForm<LabelData>({
    defaultValues: labelData,
  });
  const sectionName = "cautions";

  // Watch the caution information section to react to changes
  const watchedCautions = useWatch({
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

  // Trigger debounced save function when watched caution information changes
  useEffect(() => {
    save(sectionName, watchedCautions);
  }, [watchedCautions, save]);

  return (
    <FormProvider {...methods}>
      <Box className="p-4" data-testid="cautions-form">
        <VerifiedBilingualTable path={sectionName} loading={loading} isFocus={true} />
      </Box>
    </FormProvider>
  );
};

export default CautionsForm;
