import { Autocomplete, AutocompleteProps } from "@mui/material";
import React from "react";

/**
 * `StyledAutocomplete` is a React component that wraps the `Autocomplete` component
 * with predefined properties and styles.
 *
 * @param {AutocompleteProps<string, boolean, boolean, boolean>} props - The properties passed to the `Autocomplete` component.
 * @param {React.Ref<HTMLInputElement>} ref - The ref to be forwarded to the `Autocomplete` component.
 * @returns {JSX.Element} The rendered `Autocomplete` component with custom styles and properties.
 */
const StyledAutocomplete = React.forwardRef<
  HTMLInputElement,
  AutocompleteProps<string, boolean, boolean, boolean>
>((props, ref) => {
  return (
    <Autocomplete
      ref={ref}
      disableClearable
      freeSolo
      selectOnFocus
      slotProps={{
        popper: {
          className: "!w-fit",
        },
      }}
      {...props}
    />
  );
});

StyledAutocomplete.displayName = "StyledAutoComplete";

export default StyledAutocomplete;
