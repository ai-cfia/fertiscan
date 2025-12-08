import { Box } from "@mui/material";
import { Control, Controller, RegisterOptions } from "react-hook-form";
import { useTranslation } from "react-i18next";
import StyledAutocomplete from "./StyledAutocomplete";
import StyledTextField from "./StyledTextField";

/**
 * Props for the QuantityInput component.
 *
 * @interface QuantityInputProps
 *
 * @property {string} name - The name of the input field.
 * @property {Control} control - The control object for managing form state.
 * @property {string[]} unitOptions - An array of unit options for the input.
 * @property {boolean} [disabled] - Optional flag to disable the input.
 * @property {RegisterOptions} [unitRules] - Optional validation rules for the unit input.
 * @property {() => void} [onFocus] - Optional callback function to handle focus events.
 * @property {() => void} [onBlur] - Optional callback function to handle blur events.
 * @property {boolean} [verified] - Optional flag to indicate if the input is verified.
 */
interface QuantityInputProps {
  name: string;
  control: Control;
  unitOptions: string[];
  disabled?: boolean;
  unitRules?: RegisterOptions;
  onFocus?: () => void;
  onBlur?: () => void;
  verified?: boolean;
}

/**
 * QuantityInput component renders an input field for quantity value and a dropdown for unit selection.
 *
 * @param {QuantityInputProps} props - The properties for the QuantityInput component.
 * @param {string} props.name - The name of the input field.
 * @param {Control} props.control - The control object from react-hook-form.
 * @param {Array} props.unitOptions - The options for the unit dropdown.
 * @param {boolean} [props.disabled=false] - Flag to disable the input fields.
 * @param {RegisterOptions} props.unitRules - The validation rules for the unit field.
 * @param {Function} [props.onFocus] - The function to call on focus event.
 * @param {Function} [props.onBlur] - The function to call on blur event.
 * @param {boolean} props.verified - Flag to indicate if the input is verified.
 * @returns {JSX.Element} The rendered QuantityInput component.
 */
const QuantityInput = ({
  name,
  control,
  unitOptions,
  disabled = false,
  unitRules,
  onFocus,
  onBlur,
  verified,
}: QuantityInputProps) => {
  const { t } = useTranslation("labelDataValidator");

  return (
    <Box className="flex w-full" data-testid={`${name}-container`}>
      {/* Value Input Field */}
      <Controller
        name={`${name}.value`}
        control={control}
        rules={{
          pattern: {
            value: /^[0-9]*\.?[0-9]*$/,
            message: "errors.numbersOnly",
          },
          min: {
            value: 0,
            message: "errors.minValue",
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <StyledTextField
            {...field}
            placeholder={t("quantityInput.placeholder.value")}
            disabled={disabled}
            onFocus={onFocus}
            onBlur={(e) => {
              onBlur?.();
              field.onChange(e.target.value.trim());
            }}
            aria-label={t("quantityInput.accessibility.valueInput")}
            data-testid={`${name}-value-input`}
            error={!!error}
            helperText={error?.message ? t(error.message) : ""}
          />
        )}
      />

      {/* Unit Selection Field */}
      <Controller
        name={`${name}.unit`}
        control={control}
        rules={unitRules}
        render={({ field, fieldState: { error } }) => (
          <StyledAutocomplete
            {...field}
            options={unitOptions}
            onChange={(event, newValue) => {
              field.onChange(newValue);
            }}
            onInputChange={(event, newInputValue) => {
              field.onChange(newInputValue);
            }}
            value={field.value || ""}
            disabled={disabled}
            renderInput={(params) => (
              <StyledTextField
                {...params}
                className={`!w-[10ch] !px-2 bg-gray-100 ${verified ? "bg-gray-300": ""}`}
                aria-label={t("quantityInput.accessibility.unitDropdown")}
                data-testid={`${name}-unit-input`}
                placeholder={t("quantityInput.placeholder.unit")}
                onFocus={onFocus}
                onBlur={(e) => {
                  onBlur?.();
                  field.onChange(e.target.value.trim());
                }}
                error={!!error}
                helperText={error?.message ? t(error.message) : ""}
                slotProps={{
                  input: {
                    ...params.InputProps,
                  },
                }}
              />
            )}
          />
        )}
      />
    </Box>
  );
};

export default QuantityInput;
