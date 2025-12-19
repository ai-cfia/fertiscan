import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import YoutubeSearchedForIcon from "@mui/icons-material/YoutubeSearchedFor";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Button } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import Image from "next/image";
import { useState } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { useTranslation } from "react-i18next";

/**
 * Props for the ImageViewer component.
 *
 * @interface ImageViewerProps
 * @property {File[]} imageFiles - An array of image files to be displayed in the viewer.
 */
interface ImageViewerProps {
  imageFiles: File[];
}

/**
 * ImageViewer component displays a list of images using Swiper for navigation and
 * React Zoom Pan Pinch for zooming and panning functionality.
 *
 * @component
 * @param {ImageViewerProps} props - The props for the ImageViewer component.
 * @param {File[]} props.imageFiles - An array of image files to be displayed.
 * @returns {JSX.Element} The rendered ImageViewer component.
 */
const ImageViewer: React.FC<ImageViewerProps> = ({ imageFiles }) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(
    null,
  );
  const [zoomRefs, setZoomRefs] = useState<ReactZoomPanPinchRef[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const imageUrls = imageFiles.map((file) => URL.createObjectURL(file));

  // Initialize the zoomRefs array with null values
  const handleInit = (index: number, ref: ReactZoomPanPinchRef) => {
    setZoomRefs((prevRefs) => {
      const newRefs = [...prevRefs];
      newRefs[index] = ref;
      return newRefs;
    });
  };

  return (
    <Box
      className="flex flex-col items-center justify-center size-full  "
      data-testid="image-viewer"
    >
      <Swiper
        slidesPerView={1}
        loop={false}
        speed={0}
        data-testid="swiper"
        className="size-full"
        onSwiper={(swiper) => setSwiperInstance(swiper)}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        noSwiping
        noSwipingClass="no-swipe"
        pagination={{ clickable: true }}
        modules={[Pagination]}
      >
        {imageUrls.map((url, index) => (
          <SwiperSlide key={index} data-testid={`slide-${index + 1}`}>
            <Box className="no-swipe size-full">
              <TransformWrapper
                key={index}
                onInit={(ref) => handleInit(index, ref)}
                zoomAnimation={{ disabled: true, animationTime: 0 }}
                panning={{ velocityDisabled: true }}
                velocityAnimation={{ disabled: true }}
              >
                <TransformComponent
                  key={index}
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                  }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Image
                    key={index}
                    className="object-contain size-full"
                    src={url}
                    alt={`Slide ${index + 1}`} //*** */
                    width={500}
                    height={500}
                    data-testid={`image-slide-${index + 1}`}
                  />
                </TransformComponent>
              </TransformWrapper>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      <ControlBar
        swiper={swiperInstance}
        zoomRefs={zoomRefs}
        activeIndex={activeIndex}
      />
    </Box>
  );
};

/**
 * Props for the ControlBar component.
 *
 * @interface ControlBarProps
 * @property {SwiperClass | null} swiper - The Swiper instance or null if not available.
 * @property {ReactZoomPanPinchRef[]} zoomRefs - An array of references for the zoom and pan functionality.
 * @property {number} activeIndex - The index of the currently active item.
 */
interface ControlBarProps {
  swiper: SwiperClass | null;
  zoomRefs: ReactZoomPanPinchRef[];
  activeIndex: number;
}

/**
 * ControlBar component provides a set of controls for navigating and zooming images.
 *
 * @component
 * @param {ControlBarProps} props - The properties of the controlBar component.
 * @param {Swiper} props.swiper - The swiper instance used for navigation.
 * @param {Array<ZoomRef>} props.zoomRefs - An array of references to zoomable elements.
 * @param {number} props.activeIndex - The index of the currently active image.
 * @returns {JSX.Element} The rendered ControlBar component.
 */
const ControlBar: React.FC<ControlBarProps> = ({
  swiper,
  zoomRefs,
  activeIndex,
}) => {
  const { t } = useTranslation("imageViewer");
  const currentZoomRef = zoomRefs[activeIndex] ?? null;

  return (
    <Box
      className="flex items-center justify-center gap-4 p-4 flex-wrap"
      data-testid="control-bar"
    >
      <Tooltip title={t("controlBar.previous")}>
        <Button
          variant="contained"
          onClick={() => swiper?.slidePrev()}
          data-testid="prev-button"
          disabled={activeIndex <= 0}
          aria-label={t("controlBar.previous")}
        >
          <ArrowBackIosIcon />
        </Button>
      </Tooltip>
      <Tooltip title={t("controlBar.next")}>
        <Button
          variant="contained"
          onClick={() => swiper?.slideNext()}
          data-testid="next-button"
          disabled={activeIndex >= zoomRefs.length - 1}
          aria-label={t("controlBar.next")}
        >
          <ArrowForwardIosIcon />
        </Button>
      </Tooltip>
      <Tooltip title={t("controlBar.zoomIn")}>
        <Button
          variant="contained"
          onClick={() => currentZoomRef?.zoomIn()}
          data-testid="zoom-in-button"
          disabled={!currentZoomRef}
          aria-label={t("controlBar.zoomIn")}
        >
          <ZoomInIcon />
        </Button>
      </Tooltip>
      <Tooltip title={t("controlBar.zoomOut")}>
        <Button
          variant="contained"
          onClick={() => currentZoomRef?.zoomOut()}
          data-testid="zoom-out-button"
          disabled={!currentZoomRef}
          aria-label={t("controlBar.zoomOut")}
        >
          <ZoomOutIcon />
        </Button>
      </Tooltip>
      <Tooltip title={t("controlBar.resetZoom")}>
        <Button
          variant="contained"
          onClick={() => zoomRefs.forEach((ref) => ref?.resetTransform())}
          data-testid="reset-button"
          disabled={!currentZoomRef}
          aria-label={t("controlBar.resetZoom")}
        >
          <YoutubeSearchedForIcon />
        </Button>
      </Tooltip>
    </Box>
  );
};

export default ImageViewer;
