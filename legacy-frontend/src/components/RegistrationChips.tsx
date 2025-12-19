import { RegistrationNumber, RegistrationType } from "@/types/types";
import { Box, Chip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the RegistrationChip component.
 *
 * @extends React.ComponentProps<typeof Box>
 *
 * @property {RegistrationNumber[] | undefined} registrations -
 * An array of registration numbers or undefined.
 */
export interface RegistrationChipProps
  extends React.ComponentProps<typeof Box> {
  registrations: RegistrationNumber[] | undefined;
}

/**
 * A component that renders a list of registration chips.
 *
 * @component
 * @param {RegistrationChipProps} props - The properties for the RegistrationChips component.
 * @param {Array} props.registrations - An array of registration objects to display as chips.
 * @param {React.Ref<HTMLDivElement>} ref - A ref to the containing div element.
 * @returns {JSX.Element} The rendered RegistrationChips component.
 */
export const RegistrationChips = React.forwardRef<
  HTMLDivElement,
  RegistrationChipProps
>(({ registrations, ...rest }, ref) => {
  const { t } = useTranslation("confirmationPage");

  // Get the label for the registration type.
  const getRegistrationLabel = (type: RegistrationType) => {
    switch (type) {
      case RegistrationType.FERTILIZER:
        return "baseInformation.regType.fertilizer";
      case RegistrationType.INGREDIENT:
        return "baseInformation.regType.ingredient";
      default:
        return type;
    }
  };

  return (
    <Box
      {...rest}
      ref={ref}
      className={`flex flex-wrap gap-1 ${rest.className || ""}`}
      data-testid="registration-chips"
    >
      {registrations
        ?.filter((reg) => reg.identifier)
        .map((reg, i) => (
          <Chip
            key={i}
            label={`${reg.identifier} (${t(getRegistrationLabel(reg.type))})`}
            variant="outlined"
          />
        ))}
    </Box>
  );
});

RegistrationChips.displayName = "RegistrationChips";
