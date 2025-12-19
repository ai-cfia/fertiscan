import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, IconButtonProps, Tooltip } from "@mui/material";
import React from "react";

/**
 * Props for the StyledDeleteButton component.
 *
 * @extends IconButtonProps
 *
 * @property {string} tooltip - The text to display in the tooltip.
 * @property {number} [tooltipDelay] - Optional delay in milliseconds before the tooltip is shown.
 * @property {boolean} [hideButton] - Optional flag to hide the button.
 */
interface StyledDeleteButtonProps extends IconButtonProps {
  tooltip: string;
  tooltipDelay?: number;
  hideButton?: boolean;
}

/**
 * `StyledDeleteButton` is a React component that renders a delete button with a tooltip.
 * The button can be hidden based on the `hideButton` prop.
 *
 * @param {StyledDeleteButtonProps} props - The properties for the delete button.
 * @param {string} props.tooltip - The title for the tooltip.
 * @param {number} [props.tooltipDelay=1000] - The delay in milliseconds before the tooltip appears.
 * @param {boolean} props.hideButton - If true, the button will not be rendered.
 * @param {React.Ref<HTMLButtonElement>} ref - The ref to be forwarded to the button element.
 *
 * @returns {JSX.Element | null} The delete button with a tooltip, or null if `hideButton` is true.
 */
const StyledDeleteButton = React.forwardRef<
  HTMLButtonElement,
  StyledDeleteButtonProps
>(
  (
    {
      tooltip: tooltipTitle,
      tooltipDelay: enterDelay = 1000,
      hideButton,
      ...props
    },
    ref,
  ) => {
    if (hideButton) return null;

    return (
      <Tooltip enterDelay={enterDelay} title={tooltipTitle}>
        <IconButton
          ref={ref}
          {...props}
          size="small"
          className="text-white"
          data-testid="styled-delete-button"
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    );
  },
);

StyledDeleteButton.displayName = "StyledDeleteButton";

export default StyledDeleteButton;
