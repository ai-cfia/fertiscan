import ImageIcon from "@mui/icons-material/Image"
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { type LabelImageDetail, LabelsService } from "@/api"

interface LabelImageCardProps {
  image: LabelImageDetail
  labelId: string
}

export default function LabelImageCard({
  image,
  labelId,
}: LabelImageCardProps) {
  // ============================== State ==============================
  const [imageLoaded, setImageLoaded] = useState(false)
  // ============================== Fetch Presigned URL ==============================
  const shouldFetchUrl = image.status === "completed"
  const { data: presignedUrlData, isLoading: isLoadingUrl } = useQuery({
    queryKey: ["labels", labelId, "images", image.id, "presigned-download-url"],
    queryFn: async () => {
      const response = await LabelsService.getLabelImagePresignedDownloadUrl({
        path: {
          label_id: labelId,
          image_id: image.id,
        },
      })
      return response.data
    },
    enabled: shouldFetchUrl,
  })
  const displayUrl = presignedUrlData?.presigned_url || null
  // Reset imageLoaded when URL changes
  useEffect(() => {
    setImageLoaded(false)
  }, [])
  const isImageLoading = displayUrl && !imageLoaded
  const showSpinner = isLoadingUrl || isImageLoading
  // ============================== Render ==============================
  return (
    <Card>
      <CardContent>
        {displayUrl ? (
          <Box
            sx={{
              width: "100%",
              height: "200px",
              mb: 1,
              backgroundColor: "grey.100",
              borderRadius: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showSpinner && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "grey.100",
                  borderRadius: 1,
                }}
              >
                <CircularProgress size={32} />
              </Box>
            )}
            <Box
              component="img"
              src={displayUrl}
              alt={image.display_filename}
              onLoad={() => setImageLoaded(true)}
              sx={{
                width: "100%",
                height: "200px",
                objectFit: "contain",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.2s ease-in-out",
              }}
            />
          </Box>
        ) : isLoadingUrl ? (
          <Box
            sx={{
              width: "100%",
              height: "200px",
              mb: 1,
              backgroundColor: "grey.100",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "200px",
              mb: 1,
              backgroundColor: "grey.100",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <ImageIcon sx={{ fontSize: 48, color: "grey.400" }} />
            <Typography variant="caption" color="text.secondary">
              Image not available
            </Typography>
          </Box>
        )}
        <Typography variant="body2">{image.display_filename}</Typography>
        <Typography variant="caption" color="text.secondary">
          Sequence: {image.sequence_order}
        </Typography>
      </CardContent>
    </Card>
  )
}
