import {
  DEFAULT_ORGANIZATION,
  FormComponentProps,
  LabelData,
  Organization,
} from "@/types/types";
import { checkFieldRecord } from "@/utils/client/fieldValidation";
import useDebouncedSave from "@/utils/client/useDebouncedSave";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import RemoveDoneIcon from "@mui/icons-material/RemoveDone";
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect } from "react";
import {
  Controller,
  FieldPath,
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { VerifiedInput } from "./VerifiedFieldComponents";

// Field names of organization, used for dynamic field management
const fieldNames = Object.keys(DEFAULT_ORGANIZATION) as Array<
  keyof Organization
>;

/**
 * OrganizationsForm component.
 * Renders a page of the form for entering organizations information of a label with debounced save functionality.
 *
 * @param {FormComponentProps} props - Props passed to the component.
 * @param {LabelData} props.labelData - The current label data containing organizations.
 * @param {React.Dispatch<React.SetStateAction<LabelData>>} props.setLabelData - Function to update label data.
 * @param {boolean} [props.loading=false] - Indicates if the form is in a loading state.
 * @returns {JSX.Element} The rendered OrganizationsForm component.
 */
const OrganizationsForm: React.FC<FormComponentProps> = ({
  labelData,
  setLabelData,
  loading = false,
}) => {
  const { t } = useTranslation("labelDataValidator");
  const methods = useForm<LabelData>({
    defaultValues: labelData,
  });

  const { control, setValue } = methods;
  const sectionName = "organizations";

  const { fields, append, remove } = useFieldArray({
    control,
    name: sectionName,
  });

  // Watch the organisation section to react to changes
  const watchedOrganizations = useWatch({
    control,
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

  // Trigger debounced save function when watched organizations change
  useEffect(() => {
    save(sectionName, watchedOrganizations);
  }, [watchedOrganizations, save]);

  /**
   * Sets the verification status for all fields of a given organization.
   *
   * @param {number} orgIndex - The index of the organization to update.
   * @param {boolean} verified - The verification status to apply to all fields.
   */
  const setAllVerified = useCallback(
    (orgIndex: number, verified: boolean) => {
      fieldNames.forEach((fieldName) => {
        if (
          typeof DEFAULT_ORGANIZATION[fieldName] === "object" &&
          "verified" in DEFAULT_ORGANIZATION[fieldName]!
        ) {
          const fieldPath =
            `${sectionName}.${orgIndex}.${fieldName}.verified` as FieldPath<LabelData>;
          setValue(fieldPath, verified, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });
    },
    [setValue],
  );

  /**
   * Extracts fields that need verification from an organization.
   *
   * @param {Organization} [org] - The organization to retrieve fields from.
   * @returns {Object} An object containing verified fields.
   */
  const getVerifiedFields = (org?: Organization) =>
    org && {
      name: org.name,
      address: org.address,
      website: org.website,
      phoneNumber: org.phoneNumber,
    };

  /**
   * Handles changing the main contact radio button for organizations.
   *
   * @param {number} index - Index of the organization to set as the main contact.
   */
  const handleMainContactChange = (index: number) => {
    fields.forEach((_, i) => {
      if (i !== index) {
        setValue(`organizations.${i}.mainContact`, false);
      } else {
        setValue(`organizations.${i}.mainContact`, true);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <Box className="p-4" data-testid="organizations-form">
        <Box>
          {fields.map((field, index) => (
            <Box
              key={field.id}
              className="mb-4"
              data-testid={`organization-${index}`}
            >
              <OrganizationInformation index={index} loading={loading} />
              <Box className="mt-4 flex flex-wrap justify-end gap-2">
                <Controller
                  name={`organizations.${index}.mainContact`}
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Radio
                          {...field}
                          checked={field.value === true}
                          onChange={() => handleMainContactChange(index)}
                          data-testid={`main-contact-radio-${index}`}
                        />
                      }
                      label={
                        <Typography className="!font-bold">
                          {t("organizations.mainContact")}
                        </Typography>
                      }
                    />
                  )}
                />
                <Tooltip
                  title={t("organizations.markAllVerified")}
                  enterDelay={1000}
                >
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setAllVerified(index, true)}
                    disabled={checkFieldRecord(
                      getVerifiedFields(watchedOrganizations?.[index]),
                    )}
                    data-testid={`verify-all-btn-${index}`}
                  >
                    <DoneAllIcon />
                  </Button>
                </Tooltip>
                <Tooltip
                  title={t("organizations.markAllUnverified")}
                  enterDelay={1000}
                >
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setAllVerified(index, false)}
                    disabled={checkFieldRecord(
                      getVerifiedFields(watchedOrganizations?.[index]),
                      false,
                    )}
                    data-testid={`unverify-all-btn-${index}`}
                  >
                    <RemoveDoneIcon />
                  </Button>
                </Tooltip>
                <Tooltip
                  title={t("organizations.removeOrganisation")}
                  enterDelay={1000}
                >
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => remove(index)}
                    data-testid={`remove-org-btn-${index}`}
                    aria-label={t("organizations.removeOrganisation")}
                  >
                    <DeleteIcon />
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          ))}
          <Box className="mt-6 text-center">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => append(DEFAULT_ORGANIZATION)}
              startIcon={<AddIcon />}
              data-testid="add-org-btn"
            >
              {t("organizations.addOrganization")}
            </Button>
          </Box>
        </Box>
      </Box>
    </FormProvider>
  );
};

/**
 * Props for the OrganizationInformation component.
 *
 * @interface OrganizationInformationProps
 * @property {number} index - The index of the organization.
 * @property {boolean} [loading] - Optional flag indicating if the organization information is loading.
 */
interface OrganizationInformationProps {
  index: number;
  loading?: boolean;
}

/**
 * OrganizationsInformation component.
 * Renders input fields for an organization's details.
 *
 * @param {OrganizationInformationProps} props - Props passed to the component.
 * @param {number} props.index - The index of this organization's data in the parent form.
 * @param {boolean} [props.loading=false] - Indicates if loading state is active (disabling fields).
 * @returns {JSX.Element} The rendered OrganizationInformation component.
 */
const OrganizationInformation: React.FC<OrganizationInformationProps> = ({
  index,
  loading = false,
}) => {
  const { t } = useTranslation("labelDataValidator");

  return (
    <Box
      className="xxl:grid-cols-2 grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1"
      data-testid={`organization-info-${index}`}
    >
      <VerifiedInput
        label={t("organizations.fields.name.label")}
        placeholder={t("organizations.fields.name.placeholder")}
        path={`organizations.${index}.name`}
        loading={loading}
        data-testid={`org-name-input-${index}`}
        isFocus={true}
      />
      <VerifiedInput
        label={t("organizations.fields.address.label")}
        placeholder={t("organizations.fields.address.placeholder")}
        path={`organizations.${index}.address`}
        loading={loading}
        data-testid={`org-address-input-${index}`}
      />
      <VerifiedInput
        label={t("organizations.fields.website.label")}
        placeholder={t("organizations.fields.website.placeholder")}
        path={`organizations.${index}.website`}
        loading={loading}
        data-testid={`org-website-input-${index}`}
      />
      <VerifiedInput
        label={t("organizations.fields.phone.label")}
        placeholder={t("organizations.fields.phone.placeholder")}
        path={`organizations.${index}.phoneNumber`}
        loading={loading}
        data-testid={`org-phone-input-${index}`}
      />
    </Box>
  );
};

export default OrganizationsForm;
