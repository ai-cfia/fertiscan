import { Typography, TypographyProps } from "@mui/material";

/**
 * ErrorMessage component to display error messages with specific styling.
 *
 * @component
 * @param {string} className - Additional class names to apply to the component.
 * @param {React.ReactNode} children - The content to be displayed inside the error message.
 * @param {TypographyProps} props - Additional props to be passed to the Typography component.
 * @returns {JSX.Element} The rendered error message component.
 */
const ErrorMessage = ({
  className = "",
  children,
  ...props
}: TypographyProps) => {
  return (
    <Typography
      id="error-message"
      data-testid="modal-error-message"
      {...props}
      className={`text-red-500 ${!children ? "hidden" : "block"} ${className}`}
    >
      {children}
    </Typography>
  );
};

export default ErrorMessage;
