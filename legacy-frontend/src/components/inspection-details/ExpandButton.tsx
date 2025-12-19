import useBreakpoints from "@/utils/client/useBreakpoints";
import { IconButton, SvgIcon, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Props for the ExpandButton component.
 *
 * @interface ExpandButtonProps
 * @property {boolean} isRetracted - Indicates whether the button is in a retracted state.
 * @property {(value: boolean) => void} setIsRetracted - Function to update the retracted state.
 */
interface ExpandButtonProps {
  isRetracted: boolean;
  setIsRetracted: (value: boolean) => void;
}

/**
 * This component renders an icon button that toggles between an expanded and retracted state.
 * It uses the `useTranslation` hook to fetch localized strings for the button's aria-label and tooltip.
 * The button's icon rotates based on the `isRetracted` state and the current screen size.
 *
 * @component
 * @param {ExpandButtonProps} props - The props for the ExpandButton component.
 * @param {boolean} props.isRetracted - Indicates whether the button is in a retracted state.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setIsRetracted - Function to toggle the retracted state.
 * @returns {JSX.Element} The rendered ExpandButton component.
 */
const ExpandButton: React.FC<ExpandButtonProps> = ({
  isRetracted,
  setIsRetracted,
}) => {
  const { t } = useTranslation("confirmationPage");
  const { isDownXs, isBetweenXsSm, isBetweenSmMd, isBetweenMdLg } =
    useBreakpoints();
  const isLgOrBelow =
    isDownXs || isBetweenXsSm || isBetweenSmMd || isBetweenMdLg;

  return (
    <IconButton
      className="!absolute top-1 left-1 z-10 !bg-white"
      onClick={() => setIsRetracted(!isRetracted)}
      data-testid="retract-button"
      aria-label={
        isRetracted
          ? t("expandRetractButton.expandButton")
          : t("expandRetractButton.retractButton")
      }
    >
      <Tooltip
        title={
          isRetracted
            ? t("expandRetractButton.expandButton")
            : t("expandRetractButton.retractButton")
        }
      >
        <SvgIcon
          className={
            isRetracted
              ? isLgOrBelow
                ? "rotate-90"
                : "rotate-0"
              : isLgOrBelow
                ? "rotate-270"
                : "rotate-180"
          }
          data-testid="expand-icon"
        >
          <image href="/img/expandIcon.svg" height="24" width="24" />
        </SvgIcon>
      </Tooltip>
    </IconButton>
  );
};

export default ExpandButton;
