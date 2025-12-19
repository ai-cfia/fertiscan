import ImageViewer from "@/components/ImageViewer";
import ExpandButton from "@/components/inspection-details/ExpandButton";
import useBreakpoints from "@/utils/client/useBreakpoints";
import { Box, BoxProps, CircularProgress } from "@mui/material";
import { ReactNode, useState } from "react";

/**
 * Props for the SplitContentLayout component.
 *
 * @interface SplitContentLayoutProps
 * @extends {BoxProps}
 *
 * @property {File[]} imageFiles - An array of image files to be displayed.
 * @property {ReactNode} [topPanel] - Optional top panel content.
 * @property {ReactNode} [bottomPanel] - Optional bottom panel content.
 * @property {ReactNode} header - Content for the header section.
 * @property {ReactNode} body - Content for the body section.
 * @property {ReactNode} footer - Content for the footer section.
 * @property {boolean} [expandable] - Optional flag to indicate if the layout is expandable.
 * @property {boolean} [loadingImageViewer] - Optional flag to indicate if the image viewer is loading.
 * @property {boolean} [loadingTopPanel] - Optional flag to indicate if the top panel is loading.
 * @property {boolean} [loadingRightSection] - Optional flag to indicate if the right section is loading.
 * @property {boolean} [loadingBottomPanel] - Optional flag to indicate if the bottom panel is loading.
 */
interface SplitContentLayoutProps extends BoxProps {
  imageFiles: File[];
  topPanel?: ReactNode;
  bottomPanel?: ReactNode;
  header: ReactNode;
  body: ReactNode;
  footer: ReactNode;
  expandable?: boolean;
  loadingImageViewer?: boolean;
  loadingTopPanel?: boolean;
  loadingRightSection?: boolean;
  loadingBottomPanel?: boolean;
}

/**
 * SplitContentLayout component is a flexible layout component that arranges content
 * into a split view with optional expandable sections.
 *
 * @param {SplitContentLayoutProps} props - The properties for the SplitContentLayout component.
 * @param {React.ReactNode[]} props.imageFiles - An array of image files to be displayed in the image viewer.
 * @param {React.ReactNode} props.topPanel - Content to be displayed in the top panel.
 * @param {React.ReactNode} props.bottomPanel - Content to be displayed in the bottom panel.
 * @param {React.ReactNode} props.header - Content to be displayed in the header section.
 * @param {React.ReactNode} props.body - Content to be displayed in the body section.
 * @param {React.ReactNode} props.footer - Content to be displayed in the footer section.
 * @param {boolean} [props.expandable=false] - Flag to determine if the right section is expandable.
 * @param {boolean} [props.loadingImageViewer=false] - Flag to indicate if the image viewer is loading.
 * @param {boolean} [props.loadingTopPanel=false] - Flag to indicate if the top panel is loading.
 * @param {boolean} [props.loadingRightSection=false] - Flag to indicate if the right section is loading.
 * @param {boolean} [props.loadingBottomPanel=false] - Flag to indicate if the bottom panel is loading.
 * @param {BoxProps} [props.boxProps] - Additional properties to be passed to the main container Box component.
 * @returns {JSX.Element} The rendered SplitContentLayout component.
 */
const SplitContentLayout = ({
  imageFiles,
  topPanel,
  bottomPanel,
  header,
  body,
  footer,
  expandable = false,
  loadingImageViewer = false,
  loadingTopPanel = false,
  loadingRightSection = false,
  loadingBottomPanel = false,
  ...boxProps
}: SplitContentLayoutProps) => {
  const { isDownXs, isBetweenXsSm, isBetweenSmMd, isBetweenMdLg } =
    useBreakpoints();
  const isLgOrBelow =
    isDownXs || isBetweenXsSm || isBetweenSmMd || isBetweenMdLg;

  const [isRetractedView, setIsRetractedView] = useState(true);

  return (
    <Box
      data-testid="main-content"
      {...boxProps}
      className={`my-4 flex flex-col gap-4 ${boxProps.className}`}
    >
      {/* Top Panel on large screens */}
      {!isLgOrBelow && topPanel && (
        <Box className="w-full" data-testid="top-panel">
          {loadingTopPanel ? (
            <Box className="flex h-full items-center justify-center">
              <CircularProgress />
            </Box>
          ) : (
            topPanel
          )}
        </Box>
      )}

      <Box
        className={`flex flex-col ${isLgOrBelow ? "gap-4" : "gap-4 lg:h-[85vh] lg:min-h-[500px] lg:flex-row"}`}
      >
        {/* Left Section: Image Viewer */}
        {isRetractedView && (
          <Box
            className="flex h-[500px] min-w-0 justify-center md:h-[720px] lg:size-full"
            data-testid="image-viewer-container"
          >
            {loadingImageViewer ? (
              <Box className="flex h-full w-full items-center justify-center">
                <CircularProgress />
              </Box>
            ) : (
              <ImageViewer imageFiles={imageFiles} />
            )}
          </Box>
        )}

        {/* Top Panel on small screens */}
        {isLgOrBelow && topPanel && (
          <Box className="mt-4 w-full p-4" data-testid="top-panel-mobile">
            {loadingTopPanel ? (
              <Box className="flex h-full items-center justify-center">
                <CircularProgress />
              </Box>
            ) : (
              topPanel
            )}
          </Box>
        )}

        {/* Right Section */}
        <Box
          className="relative mb-0 flex size-full min-w-0 flex-col border border-black bg-white text-center"
          sx={{ minWidth: "500px" }}
        >
          {/* Expand Button */}
          {expandable && (
            <ExpandButton
              isRetracted={isRetractedView}
              setIsRetracted={setIsRetractedView}
            />
          )}

          <Box className="flex size-full min-w-0 flex-col gap-4 p-4 text-center">
            {loadingRightSection ? (
              <Box className="flex h-full w-full items-center justify-center">
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Header Section */}
                <Box data-testid="header-section">{header}</Box>

                {/* Body Section */}
                <Box
                  className="flex-1 overflow-y-auto p-4 sm:px-6"
                  data-testid="body-section"
                >
                  {body}
                </Box>

                {/* Footer Section */}
                <Box data-testid="footer-section">{footer}</Box>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Bottom Panel */}
      {bottomPanel && (
        <Box className="w-full" data-testid="bottom-panel">
          {loadingBottomPanel ? (
            <Box className="flex h-full items-center justify-center">
              <CircularProgress />
            </Box>
          ) : (
            bottomPanel
          )}
        </Box>
      )}
    </Box>
  );
};

export default SplitContentLayout;
