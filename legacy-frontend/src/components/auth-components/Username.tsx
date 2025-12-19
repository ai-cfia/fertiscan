import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useTranslation } from "react-i18next";
import IconInput, { IconInputProps } from "../IconInput";

/**
 * This component renders an `IconInput` component
 * specifically for the username field in an authentication form.
 *
 * @component
 * @param {IconInputProps} props - The properties passed to the `IconInput` component.
 * @returns {JSX.Element} The rendered `IconInput` component with a username icon and placeholder.
 */
const Username = ({ ...props }: IconInputProps) => {
  const { t } = useTranslation("authentication");

  return (
    <IconInput
      id="username"
      dataTestId="modal-username"
      icon={<AccountCircleIcon className="text-white mb-1" />}
      placeholder={t("signup.username")}
      type="text"
      aria-label={t("alt.userIcon")}
      {...props}
    />
  );
};

export default Username;
