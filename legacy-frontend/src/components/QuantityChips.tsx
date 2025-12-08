import { Quantity } from "@/types/types";
import { Box, Chip } from "@mui/material";
import React from "react";

/**
 * Props for the QuantityChips component.
 *
 * @interface QuantityChipsProps
 * @extends {React.ComponentProps<typeof Box>}
 *
 * @property {Quantity[] | undefined} quantities - An array of Quantity objects or undefined.
 */
export interface QuantityChipsProps extends React.ComponentProps<typeof Box> {
  quantities: Quantity[] | undefined;
}

/**
 * A React component that renders a list of quantity chips.
 *
 * @component
 * @param {QuantityChipsProps} props - The properties for the QuantityChips component.
 * @param {Array<{ value: number, unit: string }>} props.quantities - An array of quantity objects to be displayed as chips.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to be forwarded to the Box component.
 * @returns {JSX.Element} The rendered QuantityChips component.
 */
export const QuantityChips = React.forwardRef<
  HTMLDivElement,
  QuantityChipsProps
>(({ quantities, ...rest }, ref) => {
  return (
    <Box
      {...rest}
      ref={ref}
      className={`flex flex-wrap gap-1 ${rest.className || ""}`}
    >
      {quantities
        ?.filter((q) => q.value)
        .map((q, i) => (
          <Chip key={i} label={`${q.value} ${q.unit}`} variant="outlined" />
        ))}
    </Box>
  );
});

QuantityChips.displayName = "QuantityChips";
