import { AnchorHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the ToggleSign component.
 *
 * @interface ToggleSignProps
 * @extends {AnchorHTMLAttributes<HTMLAnchorElement>}
 *
 * @property {() => void} onChangeMode - Function to be called when the mode is changed.
 */
interface ToggleSignProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  onChangeMode: () => void;
}

/**
 * ToggleSign component allows users to switch between different authentication modes (e.g., sign up and sign in).
 *
 * @param {ToggleSignProps} props - The props for the component.
 * @param {function} props.onChangeMode - Callback function to handle the mode change.
 * @param {string} [props.className] - Additional class names to style the component.
 * @param {React.ReactNode} [props.children] - Optional children elements to be rendered inside the component.
 * @returns {JSX.Element} The rendered ToggleSign component.
 *
 */
const ToggleSign = ({
  onChangeMode,
  className = "",
  children,
  ...props
}: ToggleSignProps) => {
  const { t } = useTranslation("authentication");

  return (
    <a
      href="#"
      role="button"
      tabIndex={0}
      id="toggleSignButton"
      data-testid="modal-change-button"
      onClick={(e) => {
        e.preventDefault();
        onChangeMode();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChangeMode();
        }
      }}
      {...props}
      className={`underline cursor-pointer text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
    >
      {children || t("signup.switchLink")}
    </a>
  );
};

export default ToggleSign;
