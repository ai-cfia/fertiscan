import { Box, CircularProgress, Typography } from "@mui/material"
import { useTranslation } from "react-i18next"
import { Navigation, Pagination, Zoom } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import "swiper/css/zoom"

interface ImageCarouselProps {
  images: string[] | null
  isLoading?: boolean
  onSlideChange?: (index: number) => void
  paginationEl?: HTMLElement | null
}

export default function ImageCarousel({
  images,
  isLoading = false,
  onSlideChange,
  paginationEl,
}: ImageCarouselProps) {
  const { t } = useTranslation("labels")
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "& .swiper": {
          width: "100%",
          flex: 1,
        },
        "& .swiper-slide": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.paper",
        },
        "& .swiper-zoom-container": {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        "& .swiper-zoom-container > img": {
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        },
        "& .swiper-button-next, & .swiper-button-prev": {
          color: "text.primary",
        },
        "& .custom-pagination": {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 1,
          color: "text.secondary",
          fontSize: "0.875rem",
          fontWeight: 500,
        },
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <CircularProgress />
        ) : !images || images.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("image.notAvailable")}
          </Typography>
        ) : (
          <Box sx={{ width: "100%", height: "100%" }}>
            <Swiper
              modules={[Navigation, Pagination, Zoom]}
              navigation
              pagination={
                paginationEl
                  ? {
                      el: paginationEl,
                      type: "fraction",
                    }
                  : false
              }
              zoom={{
                maxRatio: 3,
                toggle: true,
                minRatio: 1,
              }}
              onSlideChange={(swiper) => {
                onSlideChange?.(swiper.activeIndex)
              }}
              style={{ width: "100%", height: "100%" }}
            >
              {images.map((src, index) => (
                <SwiperSlide key={index}>
                  <div className="swiper-zoom-container">
                    <img
                      src={src}
                      alt={t("image.slideAlt", { number: index + 1 })}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </Box>
        )}
      </Box>
    </Box>
  )
}
