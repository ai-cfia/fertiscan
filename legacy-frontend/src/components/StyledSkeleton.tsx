import Skeleton, { SkeletonProps } from "@mui/material/Skeleton";
import React from "react";

/**
 * Props for the StyledSkeleton component.
 *
 * @extends SkeletonProps
 *
 * @property {string} [animationDuration] - Optional duration for the skeleton animation.
 */
interface StyledSkeletonProps extends SkeletonProps {
  animationDuration?: string;
}

/**
 * A styled skeleton component that wraps the MUI Skeleton component with additional styles and props.
 *
 * @component
 * @param {StyledSkeletonProps} props - The properties for the StyledSkeleton component.
 * @param {string} [props.animationDuration="1s"] - The duration of the animation for the skeleton.
 * @param {string} [props.className=""] - Additional class names to apply to the skeleton.
 * @param {object} [props.rest] - Additional props to pass to the MUI Skeleton component.
 * @returns {JSX.Element} The styled skeleton component.
 */
const StyledSkeleton: React.FC<StyledSkeletonProps> = ({
  animationDuration = "1s",
  className = "",
  ...rest
}) => {
  return (
    <Skeleton
      variant="rectangular"
      className={`rounded-md !h-12 ${className}`}
      animation="wave"
      sx={{
        "&::after": {
          animationDuration,
        },
        ...rest.sx,
      }}
      data-testid="styled-skeleton"
      {...rest}
    />
  );
};

export default StyledSkeleton;
