import { FormComponentProps, LabelData, UNITS } from "@/types/types";
import useDebouncedSave from "@/utils/client/useDebouncedSave";
import { Box } from "@mui/material";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { VerifiedInput } from "./VerifiedFieldComponents";
import VerifiedQuantityList from "./VerifiedQuantityList";
import VerifiedRegistrationList from "./VerifiedRegistrationList";

/**
 * BaseInformationForm component.
 * Renders a page of the form for entering base information of a label with debounced save functionality.
 *
 * @param {FormComponentProps} props - The properties passed to this component.
 * @param {boolean} [props.loading=false] - Determines if loading state is active (disabling fields).
 * @param {LabelData} props.labelData - The label data being edited in this form page.
 * @param {React.Dispatch<React.SetStateAction<LabelData>>} props.setLabelData - Function to update label data.
 * @returns {JSX.Element} The rendered BaseInformationForm component.
 */
const BaseInformationForm: React.FC<FormComponentProps> = ({
  loading = false,
  labelData,
  setLabelData,
}) => {
  const { t } = useTranslation("labelDataValidator");
  const methods = useForm<LabelData>({
    defaultValues: labelData,
  });
  const sectionName = "baseInformation";

  // Watch the base information section to react to changes
  const watchedBaseInformation = useWatch({
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

  // Trigger debounced save function when watched base information changes
  useEffect(() => {
    save(sectionName, watchedBaseInformation);
  }, [watchedBaseInformation, save]);

  return (
    <FormProvider {...methods}>
      <Box className="p-4" data-testid="base-information-form">
        <Box className="grid grid-cols-1 items-start sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xxl:grid-cols-2 gap-4 py-4">
          <VerifiedInput
            label={t("baseInformation.fields.name.label")}
            placeholder={t("baseInformation.fields.name.placeholder")}
            path="baseInformation.name"
            loading={loading}
            isFocus={true}
          />
          <VerifiedRegistrationList
            label={t("baseInformation.fields.reg.label")}
            path="baseInformation.registrationNumbers"
            loading={loading}
          />
          <VerifiedInput
            label={t("baseInformation.fields.lotNumber.label")}
            placeholder={t("baseInformation.fields.lotNumber.placeholder")}
            path="baseInformation.lotNumber"
            loading={loading}
          />
          <VerifiedInput
            label={t("baseInformation.fields.npk.label")}
            placeholder={t("baseInformation.fields.npk.placeholder")}
            path="baseInformation.npk"
            loading={loading}
          />
          <VerifiedQuantityList
            label={t("baseInformation.fields.weight.label")}
            path="baseInformation.weight"
            unitOptions={UNITS.weight}
            loading={loading}
          />
          <VerifiedQuantityList
            label={t("baseInformation.fields.density.label")}
            path="baseInformation.density"
            unitOptions={UNITS.density}
            loading={loading}
          />
          <VerifiedQuantityList
            label={t("baseInformation.fields.volume.label")}
            path="baseInformation.volume"
            unitOptions={UNITS.volume}
            loading={loading}
          />
        </Box>
      </Box>
    </FormProvider>
  );
};

export default BaseInformationForm;
