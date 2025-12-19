import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  InputProps,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the IconInput component.
 *
 * @interface IconInputProps
 * @extends InputProps
 *
 * @property {React.ReactNode} [icon] - Optional icon to be displayed inside the input.
 * @property {(value: string) => void} setValue - Function to set the value of the input.
 * @property {string} [dataTestId] - Optional data-testid attribute for testing purposes.
 */
export interface IconInputProps extends InputProps {
  icon?: React.ReactNode;
  setValue: (value: string) => void;
  dataTestId?: string;
}

/**
 * IconInput component renders an input field with an optional icon and password visibility toggle.
 *
 * @component
 * @param {IconInputProps} props - The properties for the IconInput component.
 * @param {string} props.id - The id of the input element.
 * @param {React.ReactNode} props.icon - The icon to be displayed inside the input field.
 * @param {string} props.type - The type of the input field (e.g., "text", "password").
 * @param {function} props.setValue - The function to set the value of the input field.
 * @param {string} [props.dataTestId] - The data-testid attribute for testing purposes.
 * @param {object} [props.inputProps] - Additional props to be passed to the input element.
 * @returns {JSX.Element} The rendered IconInput component.
 */
const IconInput: React.FC<IconInputProps> = ({
  id,
  icon,
  type,
  setValue,
  dataTestId,
  ...inputProps
}) => {
  const { t } = useTranslation("labelDataValidator");
  const [hasFocus, setFocus] = useState(false);
  const [trueType, setTrueType] = useState(type);
  const [showPassword, setShowPassword] = useState(false);

  // Handle the visibility of the password input.
  const handleClickShowPassword = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setTrueType(!showPassword ? "text" : "password");
    setShowPassword(!showPassword);
    if (id) document.getElementById(id)!.focus();
  };

  // Handle the focus of the input field.
  const handleInputFocus = () => {
    setFocus(true);
    if (type == "password") {
      const adornment = document.getElementById(id + "-show_password");
      adornment!.style.display = "block";
    }
  };

  // Handle the blur of the input field.
  const handleInputBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (type == "password") {
      const adornment = document.getElementById(id + "-show_password");
      if (adornment!.matches(":hover")) {
        e.currentTarget!.focus();
        return;
      }
      adornment!.style.display = "none";
      setTrueType("password");
    }
    setFocus(false);
  };

  // Display the password visibility toggle if the input type is "password".
  const showPasswordAdornment =
    type === "password" ? (
      <InputAdornment
        id={id + "-show_password"}
        sx={{ display: hasFocus ? "block" : "none" }}
        position="end"
      >
        <IconButton
          aria-label={
            showPassword
              ? t("iconInput.hidePassword")
              : t("iconInput.displayPassword")
          }
          onClick={handleClickShowPassword}
          edge="end"
          className="!text-white"
        >
          {showPassword ? (
            <VisibilityOff sx={{ fontSize: "medium" }} />
          ) : (
            <Visibility sx={{ fontSize: "medium" }} />
          )}
        </IconButton>
      </InputAdornment>
    ) : (
      <></>
    );

  return (
    <FormControl variant="standard" data-testid={dataTestId}>
      <Input
        id={id}
        type={trueType}
        className="
          text-white
          bg-transparent
          border-0
          before:border-b-1
          before:border-white
          hover:before:!border-b-2
          after:!transition-none
          min-w-40
        "
        sx={{
          color: "white",
          backgroundColor: "transparent",
          border: 0,
          "::before": {
            borderBottom: "1px solid white",
          },
          "&:hover::before": {
            borderBottom: "2px solid white !important",
          },
        }}
        onChange={(e) => setValue(e.target.value)}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        startAdornment={
          <InputAdornment position="start">{icon}</InputAdornment>
        }
        endAdornment={showPasswordAdornment}
        data-testid="input"
        {...inputProps}
      />
    </FormControl>
  );
};

export default IconInput;
