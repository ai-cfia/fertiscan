import { Typography, TypographyProps } from "@mui/material";

/**
 * Title component that renders a Typography element with predefined styles.
 *
 * @param {string} [className=""] - Additional class names to apply to the Typography element.
 * @param {TypographyProps} props - Additional props to pass to the Typography element.
 * @returns {JSX.Element} The rendered Typography element.
 */
const Title = ({ className = "", ...props }: TypographyProps) => (
  <Typography
    variant="h3"
    data-testid="modal-title"
    {...props}
    className={`pl-4 pt-2 !mb-8 text-white ${className}`}
  />
);

export default Title;
