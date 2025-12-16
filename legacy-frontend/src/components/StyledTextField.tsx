import { TextField, TextFieldProps } from "@mui/material";
import React from "react";

/**
 * A styled text field component that uses `React.forwardRef` to pass a ref to the underlying input element.
 * This component wraps the `TextField` component and applies additional styles and properties.
 *
 * @param {TextFieldProps} props - The properties passed to the `TextField` component.
 * @param {React.Ref<HTMLInputElement>} ref - The ref to be forwarded to the input element.
 * @returns {JSX.Element} The styled text field component.
 */
const StyledTextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (props, ref) => {
    return (
      <TextField
        {...props}
        ref={ref}
        variant="standard"
        fullWidth
        placeholder={props.placeholder}
        autoComplete="off"
        autoFocus={props.autoFocus}
        slotProps={{
          ...props.slotProps,
          input: {
            ...props.slotProps?.input,
            disableUnderline: true,
            className: "!text-[15px]",
          },
        }}
        focused={props.focused}
      />
    );
  },
);

StyledTextField.displayName = "StyledTextField";

export default StyledTextField;
