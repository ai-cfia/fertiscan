import LockIcon from "@mui/icons-material/Lock";
import { useTranslation } from "react-i18next";
import IconInput, { IconInputProps } from "../IconInput";

/**
 * PasswordInput component renders an IconInput specifically for password fields.
 *
 * @component
 * @param {IconInputProps} props - The properties passed down to the IconInput component.
 * @returns {JSX.Element} The rendered IconInput component with a lock icon and password type.
 */
const PasswordInput = ({ ...props }: IconInputProps) => {
  const { t } = useTranslation("authentication");

  return (
    <IconInput
      dataTestId="modal-password"
      id="password"
      icon={<LockIcon className="text-white mb-1" />}
      placeholder={t("signup.password")}
      type="password"
      aria-label={t("alt.lockIcon")}
      {...props}
    />
  );
};

export default PasswordInput;
