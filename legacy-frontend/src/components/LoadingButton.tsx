import { Button, ButtonProps, CircularProgress } from "@mui/material";

/**
 * Props for the LoadingButton component.
 *
 * @extends ButtonProps
 *
 * @property {boolean} loading - Indicates whether the button is in a loading state.
 * @property {string} text - The text to be displayed on the button.
 */
interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
  text: string;
}

/**
 * A button component that displays a loading spinner when in a loading state.
 *
 * @component
 * @param {LoadingButtonProps} props - The properties for the LoadingButton component.
 * @param {boolean} props.loading - Indicates whether the button is in a loading state.
 * @param {string} props.text - The text to display on the button.
 * @param {boolean} [props.disabled] - Indicates whether the button is disabled.
 * @param {React.ReactNode} [props.children] - The children elements to display inside the button when not loading.
 * @param {object} [props] - Additional properties to pass to the Button component.
 * @returns {JSX.Element} The rendered LoadingButton component.
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  text,
  disabled,
  children,
  ...props
}) => {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <CircularProgress
            size={16}
            color="inherit"
            data-testid="loading-spinner"
          />
          <span className="ml-2">{text}</span>
        </>
      ) : (
        children || <span>{text}</span>
      )}
    </Button>
  );
};

export default LoadingButton;
