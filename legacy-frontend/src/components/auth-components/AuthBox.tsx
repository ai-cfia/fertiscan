import { Box, BoxProps } from "@mui/material";

/**
 * `AuthBox` is a styled component that centers its content both horizontally and vertically
 * within its parent container. It applies various Tailwind CSS classes to style the box,
 * including width, height, padding, background color, border radius, shadow, and flex properties.
 *
 * @component
 * @param {string} [className=""] - Additional CSS classes to apply to the component.
 * @param {BoxProps} props - Additional properties to pass to the Box component.
 * @returns {JSX.Element} A styled Box component.
 */
const AuthBox = ({ className = "", ...props }: BoxProps) => (
  <Box
    {...props}
    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 max-w-lg max-h-[500px] px-4 py-4 bg-sky-900 rounded-2xl shadow-2xl outline-none flex flex-col ${className}`}
  />
);

export default AuthBox;
