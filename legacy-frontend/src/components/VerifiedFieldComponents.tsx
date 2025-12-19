import CheckIcon from "@mui/icons-material/Check";
import HelpIcon from "@mui/icons-material/Help";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Box,
  Divider,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Control, Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import StyledSkeleton from "./StyledSkeleton";
import StyledTextField from "./StyledTextField";

/**
 * Props for the VerifiedFieldWrapper component.
 *
 * @property {string | ReactNode} label - The label to display for the field.
 * @property {string} path - The path to the field value in the form data.
 * @property {string} [className] - Optional additional class names for styling.
 * @property {boolean} [loading] - Optional flag to indicate if the field is in a loading state.
 * @property {(props: { setIsFocused: (value: boolean) => void; control: Control; valuePath: string; verified: boolean; }) => ReactNode} renderField - Function to render the field component.
 * @property {(callback: (valid: boolean) => void) => Promise<void>} [validate] - Optional function to validate the field value.
 */
interface VerifiedFieldWrapperProps {
  label: string | ReactNode;
  path: string;
  className?: string;
  loading?: boolean;
  renderField: (props: {
    setIsFocused: (value: boolean) => void;
    control: Control;
    valuePath: string;
    verified: boolean;
  }) => ReactNode;
  validate?: (callback: (valid: boolean) => void) => Promise<void>;
}

/**
 * A wrapper component for rendering a verified field with a label, loading state, and verification toggle button.
 *
 * @param {VerifiedFieldWrapperProps} props - The properties for the VerifiedFieldWrapper component.
 * @param {string | React.ReactNode} props.label - The label to display for the field. Can be a string or a React node.
 * @param {string} props.path - The path to the field in the form context.
 * @param {string} [props.className=""] - Additional class names to apply to the wrapper.
 * @param {boolean} [props.loading=false] - Whether the field is in a loading state.
 * @param {Function} props.renderField - A function to render the field component.
 * @param {Function} [props.validate] - An optional validation function to validate the field before toggling verification.
 *
 * @returns {JSX.Element} The rendered VerifiedFieldWrapper component.
 */
export const VerifiedFieldWrapper: React.FC<VerifiedFieldWrapperProps> = ({
  label,
  path,
  className = "",
  loading = false,
  renderField,
  validate,
}) => {
  const { t } = useTranslation("labelDataValidator");
  const { control } = useFormContext();
  const [isFocused, setIsFocused] = useState(false);
  const [hover, setHover] = useState(false);
  const [iconFocus, setIconFocus] = useState(false);

  const valuePath = `${path}.value`;
  const verifiedPath = `${path}.verified`;
  const verified: boolean = useWatch({
    control,
    name: verifiedPath,
  });

  return (
    <Box>
      {typeof label === "string" ? (
        <Typography
          className="!font-bold select-none text-left pl-2"
          data-testid={`field-label-${path}`}
        >
          {label}
        </Typography>
      ) : (
        label
      )}
      {loading ? (
        <StyledSkeleton />
      ) : (
        <Box
          className={`flex items-center rounded-br-md rounded-tr-md border-2 p-1 ${
            isFocused ? "border-fertiscan-blue" : "border-[#e5e7eb]"
          } ${verified ? "border-green-500 bg-gray-300" : ""} ${className}`}
          data-testid={`verified-field-${path}`}
        >
          {renderField({ setIsFocused, control, valuePath, verified })}

          {/* Vertical Divider */}
          <Divider
            orientation="vertical"
            flexItem
            className={`${isFocused ? "!border-fertiscan-blue" : ""} ${verified ? "bg-green-500" : "bg-inherit"}`}
            data-testid={`divider-${path}`}
          />

          {/* Verified Toggle Button */}
          <Controller
            name={verifiedPath}
            control={control}
            render={({ field: { value, onChange } }) => (
              <Tooltip
                title={
                  verified
                    ? t("verifiedInput.unverify")
                    : t("verifiedInput.verify")
                }
                enterDelay={1000}
              >
                <IconButton
                  onClick={() =>
                    validate
                      ? validate((valid) => {
                          if (valid) onChange(!value);
                        })
                      : onChange(!value)
                  }
                  data-testid={`toggle-verified-btn-${verifiedPath}`}
                  aria-label={
                    verified
                      ? t("verifiedInput.unverify")
                      : t("verifiedInput.verify")
                  }
                  onMouseEnter={() => setHover(true)}
                  onMouseLeave={() => setHover(false)}
                  onFocus={() => {
                    setIconFocus(!iconFocus);
                    setIsFocused(true);
                  }}
                  onBlur={() => {
                    setIconFocus(!iconFocus);
                    setIsFocused(false);
                  }}
                >
                  {hover && verified ? (
                    <SvgIcon aria-hidden>
                      <image
                        href="/img/unverifyIcon.svg"
                        height="24"
                        width="24"
                      />
                    </SvgIcon>
                  ) : (
                    <CheckIcon
                      className={`${value ? "text-green-500" : ""} ${iconFocus ? "font-bold text-fertiscan-blue" : ""} `}
                      data-testid={`verified-icon-${verifiedPath}`}
                      aria-hidden
                    />
                  )}
                </IconButton>
              </Tooltip>
            )}
          />
        </Box>
      )}
    </Box>
  );
};

/**
 * Props for the VerifiedRadio component.
 *
 * @property {string} label - The label for the radio button.
 * @property {string} path - The path associated with the radio button.
 * @property {string} [className] - Optional CSS class name for styling.
 * @property {boolean} [loading] - Optional flag to indicate loading state.
 * @property {boolean} [isHelpActive] - Optional flag to indicate if help text is active.
 * @property {string} [helpText] - Optional help text to display.
 * @property {boolean} [isFocus] - Optional flag to indicate if the radio button is focused.
 */
interface VerifiedRadioProps {
  label: string;
  path: string;
  className?: string;
  loading?: boolean;
  isHelpActive?: boolean;
  helpText?: string;
  isFocus?: boolean;
}

/**
 * `VerifiedRadio` is a React functional component that renders a radio button group
 * with additional features such as loading state, help tooltip, and focus management.
 *
 * @param {VerifiedRadioProps} props - The properties for the `VerifiedRadio` component.
 * @param {string} props.label - The label for the radio group.
 * @param {string} props.path - The path used for data binding and test identification.
 * @param {string} [props.className=""] - Optional additional class names for styling.
 * @param {boolean} [props.loading=false] - Indicates if the component is in a loading state.
 * @param {boolean} [props.isHelpActive=false] - Indicates if the help tooltip is active.
 * @param {string} [props.helpText] - The text to display in the help tooltip.
 * @param {boolean} [props.isFocus=false] - Indicates if the radio group should be focused.
 * @returns {JSX.Element} The rendered `VerifiedRadio` component.
 */
export const VerifiedRadio: React.FC<VerifiedRadioProps> = ({
  label,
  path,
  className = "",
  loading = false,
  isHelpActive = false,
  helpText,
  isFocus = false,
}) => {
  const { t } = useTranslation("labelDataValidator");
  const [hoverHelp, setHoverHelp] = useState(false);
  const radioGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocus && radioGroupRef.current) {
      radioGroupRef.current.focus();
    }
  }, [isFocus]);

  return (
    <VerifiedFieldWrapper
      label={
        <Box className="flex items-start">
          <Typography
            className="select-none pl-2 text-left !font-bold"
            data-testid={`field-label-${path}`}
          >
            {label}
          </Typography>
          {isHelpActive && (
            <>
              <Tooltip title={helpText}>
                <IconButton
                  aria-label="help"
                  onMouseEnter={() => setHoverHelp(true)}
                  onMouseLeave={() => setHoverHelp(false)}
                  className="!bg-transparent p-0"
                >
                  {hoverHelp ? (
                    <HelpIcon
                      className="-mb-4 -mt-2"
                      style={{ fontSize: "20" }}
                    />
                  ) : (
                    <HelpOutlineIcon
                      className="-mb-4 -mt-2"
                      style={{ fontSize: "20" }}
                    />
                  )}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      }
      path={path}
      className={className}
      loading={loading}
      renderField={({ setIsFocused, control, valuePath, verified }) => (
        <Controller
          name={valuePath}
          control={control}
          render={({ field }) => (
            <RadioGroup
              ref={radioGroupRef}
              tabIndex={0}
              value={field.value ? "yes" : "no"}
              onChange={(e) => field.onChange(e.target.value === "yes")}
              className="flex-1 !flex-row px-2"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              data-testid={`radio-group-field-${valuePath}`}
              aria-label={`${t("verifiedInput.accessibility.radioGroup")}`}
            >
              <FormControlLabel
                value="yes"
                control={<Radio size="small" />}
                label={
                  <Typography className="select-none !text-[15px]">
                    {t("verifiedInput.options.yes")}
                  </Typography>
                }
                disabled={verified}
                data-testid={`radio-yes-field-${valuePath}`}
              />
              <FormControlLabel
                value="no"
                control={<Radio size="small" />}
                label={
                  <Typography className="select-none !text-[15px]">
                    {t("verifiedInput.options.no")}
                  </Typography>
                }
                disabled={verified}
                data-testid={`radio-no-field-${valuePath}`}
              />
            </RadioGroup>
          )}
        />
      )}
    />
  );
};

/**
 * Props for the VerifiedInput component.
 *
 * @property {string} label - The label for the input field.
 * @property {string} placeholder - The placeholder text for the input field.
 * @property {string} path - The path used for some internal logic or data binding.
 * @property {string} [className] - Optional additional CSS class names for styling.
 * @property {boolean} [loading] - Optional flag to indicate if the input is in a loading state.
 * @property {boolean} [isFocus] - Optional flag to indicate if the input should be focused.
 */
interface VerifiedInputProps {
  label: string;
  placeholder: string;
  path: string;
  className?: string;
  loading?: boolean;
  isFocus?: boolean;
}

/**
 * A React functional component that renders a verified input field.
 *
 * @param {VerifiedInputProps} props - The properties for the VerifiedInput component.
 * @param {string} props.label - The label for the input field.
 * @param {string} props.placeholder - The placeholder text for the input field.
 * @param {string} props.path - The path used for the input field.
 * @param {string} [props.className=""] - Additional CSS classes for the input field.
 * @param {boolean} [props.loading=false] - Indicates if the input field is in a loading state.
 * @param {boolean} [props.isFocus=false] - Indicates if the input field should be auto-focused.
 * @returns {JSX.Element} The rendered VerifiedInput component.
 */
export const VerifiedInput: React.FC<VerifiedInputProps> = ({
  label,
  placeholder,
  path,
  className = "",
  loading = false,
  isFocus = false,
}) => {
  const { t } = useTranslation("labelDataValidator");

  return (
    <VerifiedFieldWrapper
      label={label}
      path={path}
      className={className}
      loading={loading}
      renderField={({ setIsFocused, control, valuePath, verified }) => (
        <Controller
          name={valuePath}
          control={control}
          render={({ field }) => (
            <StyledTextField
              {...field}
              placeholder={placeholder}
              className="!ml-2 !text-[15px]"
              disabled={verified}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                setIsFocused(false);
                if (field.value.trim() !== e.target.value.trim()) {
                  field.onChange(e.target.value.trim());
                }
              }}
              data-testid={`input-field-${valuePath}`}
              aria-label={`${t("verifiedInput.accessibility.input")}`}
              autoFocus={isFocus}
            />
          )}
        />
      )}
    />
  );
};
