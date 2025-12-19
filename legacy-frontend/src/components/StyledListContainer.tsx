import AddIcon from "@mui/icons-material/Add";
import { Box, BoxProps, Button } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the StyledListContainer component.
 *
 * @extends {BoxProps}
 *
 * @property {string} path - The path associated with the list container.
 * @property {boolean} [verified] - Optional flag indicating if the item is verified.
 * @property {() => void} onAppend - Callback function to handle append action.
 * @property {React.ReactNode} children - The child elements to be rendered within the container.
 */
interface StyledListContainerProps extends BoxProps {
  path: string;
  verified?: boolean;
  onAppend: () => void;
  children: React.ReactNode;
}

/**
 * A styled container component for rendering a list with an optional "Add Row" button.
 *
 * @param {StyledListContainerProps} props - The properties for the StyledListContainer component.
 * @param {string} props.path - The path used for data-testid attributes.
 * @param {boolean} props.verified - A flag indicating whether the list is verified. If true, the "Add Row" button is hidden and disabled.
 * @param {() => void} props.onAppend - The callback function to be called when the "Add Row" button is clicked.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the container.
 * @param {BoxProps} [props.boxProps] - Additional properties to be passed to the Box component.
 * @returns {JSX.Element} The rendered StyledListContainer component.
 */
const StyledListContainer: React.FC<StyledListContainerProps> = ({
  path,
  verified,
  onAppend,
  children,
  ...boxProps
}) => {
  const t = useTranslation("labelDataValidator").t;
  return (
    <Box
      className="flex flex-1 flex-col"
      data-testid={`fields-container-${path}`}
      {...boxProps}
    >
      {children}

      {/* Add Row Button */}
      <Button
        size="small"
        className={`!p-2 text-white bg-green-500 ${verified ? "!hidden" : ""}`}
        onClick={onAppend}
        startIcon={<AddIcon />}
        disabled={verified}
        data-testid={`add-button-${path}`}
      >
        {t("listContainer.addRow")}
      </Button>
    </Box>
  );
};

export default StyledListContainer;
