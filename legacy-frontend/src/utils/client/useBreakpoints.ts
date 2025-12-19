import { Breakpoints } from "@/types/breakpoints";
import { useMediaQuery, useTheme } from "@mui/material";

/**
 * Custom Hook: useBreakpoints
 *
 * This custom hook utilizes Material-UI's theme and media queries to determine the current screen size
 * and returns an object indicating which breakpoint range the screen size falls into.
 *
 * @returns {Breakpoints} An object with boolean values for each breakpoint range.
 */
const useBreakpoints = (): Breakpoints => {
  const theme = useTheme();

  return {
    isDownXs: useMediaQuery(theme.breakpoints.down("xs")),
    isBetweenXsSm: useMediaQuery(theme.breakpoints.between("xs", "sm")),
    isBetweenSmMd: useMediaQuery(theme.breakpoints.between("sm", "md")),
    isBetweenMdLg: useMediaQuery(theme.breakpoints.between("md", "lg")),
    isUpLg: useMediaQuery(theme.breakpoints.up("lg")),
  };
};

export default useBreakpoints;
