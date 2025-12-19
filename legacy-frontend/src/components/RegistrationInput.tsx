import { RegistrationType } from "@/types/types";
import { Box, MenuItem, Select } from "@mui/material";
import { Control, Controller, RegisterOptions } from "react-hook-form";
import { useTranslation } from "react-i18next";
import StyledTextField from "./StyledTextField";

/**
 * Props for the RegistrationInput component.
 *
 * @interface RegistrationInputProps
 * @property {string} name - The name of the input field.
 * @property {Control} control - The control object for managing the input state.
 * @property {boolean} [disabled] - Optional flag to disable the input field.
 * @property {RegisterOptions} [typeRules] - Optional validation rules for the input field.
 * @property {() => void} [onFocus] - Optional callback function to handle focus event.
 * @property {() => void} [onBlur] - Optional callback function to handle blur event.
 * @property {boolean} [verified] - Optional flag to indicate if the input is verified.
 */
interface RegistrationInputProps {
  name: string;
  control: Control;
  disabled?: boolean;
  typeRules?: RegisterOptions;
  onFocus?: () => void;
  onBlur?: () => void;
  verified?: boolean;
}

/**
 * RegistrationInput component for handling registration input fields.
 *
 * @param {RegistrationInputProps} props - The properties for the RegistrationInput component.
 * @param {string} props.name - The name of the input field.
 * @param {Control} props.control - The control object from react-hook-form.
 * @param {boolean} [props.disabled=false] - Flag to disable the input fields.
 * @param {RegisterOptions} props.typeRules - Validation rules for the registration type field.
 * @param {Function} [props.onFocus] - Callback function to handle focus event.
 * @param {Function} [props.onBlur] - Callback function to handle blur event.
 * @param {boolean} props.verified - Flag to indicate if the input is verified.
 * @returns {JSX.Element} The rendered RegistrationInput component.
 */
const RegistrationInput = ({
  name,
  control,
  disabled = false,
  typeRules,
  onFocus,
  onBlur,
  verified,
}: RegistrationInputProps) => {
  const { t } = useTranslation("labelDataValidator");

  return (
    <Box className="flex w-full" data-testid={`${name}-container`}>
      {/* Identifier Input Field */}
      <Controller
        name={`${name}.identifier`}
        control={control}
        rules={{
          pattern: {
            value: /^\d{7}[A-Z]$/,
            message: "errors.invalidRegistrationNumber",
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <StyledTextField
            {...field}
            placeholder={t("registrationInput.placeholder")}
            disabled={disabled}
            onFocus={onFocus}
            onBlur={(e) => {
              onBlur?.();
              field.onChange(e.target.value.trim());
            }}
            aria-label={t("registrationInput.accessibility.identifier")}
            data-testid={`${name}-number-input`}
            error={!!error}
            helperText={error?.message ? t(error.message) : ""}
          />
        )}
      />

      {/* Registration Type Selection Field */}
      <Controller
        name={`${name}.type`}
        control={control}
        rules={typeRules}
        render={({ field }) => (
          <Select
            {...field}
            className={`!w-[20ch] !text-[15px] ${verified ? "bg-inherit" : "bg-gray-100"} px-2`}
            variant="standard"
            autoComplete="off"
            value={field.value || ""}
            onChange={(event) => field.onChange(event.target.value)}
            disabled={disabled}
            fullWidth
            disableUnderline
          >
            <MenuItem value={RegistrationType.FERTILIZER}>
              {t("registrationInput.type.fertilizer")}
            </MenuItem>
            <MenuItem value={RegistrationType.INGREDIENT}>
              {t("registrationInput.type.ingredient")}
            </MenuItem>
          </Select>
        )}
      />
    </Box>
  );
};

export default RegistrationInput;
