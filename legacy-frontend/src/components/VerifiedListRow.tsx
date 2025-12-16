import { Box, Divider } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import StyledDeleteButton from "./StyledDeleteButton";

/**
 * Props for the VerifiedListRow component.
 *
 * @property {boolean} [verified] - Indicates if the item is verified.
 * @property {boolean} [hideDelete] - Determines if the delete option should be hidden.
 * @property {() => void} [onDelete] - Callback function to handle delete action.
 * @property {boolean} [isLastItem] - Indicates if the item is the last in the list.
 * @property {React.ReactNode} children - The content to be rendered within the row.
 */
interface VerifiedListRowProps {
  verified?: boolean;
  hideDelete?: boolean;
  onDelete?: () => void;
  isLastItem?: boolean;
  children: React.ReactNode;
}

/**
 * `VerifiedListRow` is a React functional component that renders a row with a delete button and a divider.
 *
 * @param {VerifiedListRowProps} props - The properties for the VerifiedListRow component.
 * @param {boolean} props.verified - Indicates if the row is verified.
 * @param {boolean} props.hideDelete - Determines if the delete button should be hidden.
 * @param {function} props.onDelete - Callback function to handle delete action.
 * @param {boolean} props.isLastItem - Indicates if the row is the last item in the list.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the row.
 * @returns {JSX.Element} The rendered component.
 */
const VerifiedListRow: React.FC<VerifiedListRowProps> = ({
  verified,
  hideDelete,
  onDelete,
  isLastItem,
  children,
}) => {
  const { t } = useTranslation("labelDataValidator");
  return (
    <Box className="ml-2" data-testid={`field-row`}>
      <Box className="flex items-center">
        {children}

        <StyledDeleteButton
          tooltip={t("deleteVerifiedListRow")}
          hideButton={verified || hideDelete}
          onClick={onDelete}
          aria-label={t("verifiedListRow.accessibility.deleteRowButtons")}
        />
      </Box>

      <Divider
        className={`!my-1 ${verified ? "bg-green-500" : "bg-inherit"} ${isLastItem && verified ? "hidden" : ""}`}
      />
    </Box>
  );
};

export default VerifiedListRow;
