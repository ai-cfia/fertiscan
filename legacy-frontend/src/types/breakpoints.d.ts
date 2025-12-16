/**
 * Breakpoints Type
 *
 * This type represents the different screen size breakpoints used in the application.
 * It includes boolean values for each standard breakpoint.
 */
export type Breakpoints = {
  // Represents if the screen size is extra small
  isDownXs: boolean;

  // Represents if the screen size is small
  isBetweenXsSm: boolean;

  // Represents if the screen size is medium
  isBetweenSmMd: boolean;

  // Represents if the screen size is large
  isBetweenMdLg: boolean;

  // Represents if the screen size is extra large
  isUpLg: boolean;
};
