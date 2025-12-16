import { FormComponentProps, LabelData, UNITS } from "@/types/types";
import useDebouncedSave from "@/utils/client/useDebouncedSave";
import { Box, Typography } from "@mui/material";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import VerifiedBilingualTable from "./VerifiedBilingualTable";
import { VerifiedRadio } from "./VerifiedFieldComponents";

/**
 * IngredientsForm component.
 * Renders a page of the form for entering ingredients information of a label with debounced save functionality.
 *
 * @param {FormComponentProps} props - The properties passed to this component.
 * @param {boolean} [props.loading=false] - Determines if loading state is active (disabling fields).
 * @param {LabelData} props.labelData - The label data being edited in this form page.
 * @param {React.Dispatch<React.SetStateAction<LabelData>>} props.setLabelData - Function to update label data.
 * @returns {JSX.Element} The rendered IngredientsForm component.
 */
const IngredientsForm: React.FC<FormComponentProps> = ({
  labelData,
  setLabelData,
  loading = false,
}) => {
  const { t } = useTranslation("labelDataValidator");
  const methods = useForm<LabelData>({
    defaultValues: labelData,
  });
  const sectionName = "ingredients";

  // Watch the ingredient information section to react to changes
  const watchedIngredients = useWatch({
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

  // Trigger debounced save function when watched ingredient information changes
  useEffect(() => {
    save(sectionName, watchedIngredients);
  }, [watchedIngredients, save]);

  return (
    <FormProvider {...methods}>
      <Box className="p-4 text-left" data-testid="ingredients-form">
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          data-testid="guaranteed-analysis-title"
        >
          {t("ingredients.labellingOptions")}
        </Typography>
        <Box className="grid grid-cols-1 items-start sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xxl:grid-cols-2 gap-4 p-4">
          <Box className="flex flex-shrink-0">
            <VerifiedRadio
              label={t("ingredients.recordKeeping")}
              path="ingredients.recordKeeping"
              loading={loading}
              isHelpActive={true}
              helpText={t("ingredients.helpMessage.recordKeeping")}
              data-testid="guaranteed-analysis-record-keeping"
              isFocus={true}
            />
          </Box>
        </Box>
        {!watchedIngredients?.recordKeeping.value && (
          <>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              className="!mt-16"
              data-testid="guaranteed-analysis-nutrients-title"
            >
              {t("ingredients.nutrients")}
            </Typography>
            <Box className="px-4">
              <VerifiedBilingualTable
                path={"ingredients.nutrients"}
                unitOptions={UNITS.ingredients}
                valueColumn
                loading={loading}
                isFocus={false}
              />
            </Box>
          </>
        )}
      </Box>
    </FormProvider>
  );
}

export default IngredientsForm;
