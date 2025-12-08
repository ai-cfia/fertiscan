import { fetchImages } from "@/utils/client/requests";
import { InspectionData } from "@/utils/server/backend";
import ErrorIcon from "@mui/icons-material/Error";
import {
  Box,
  Card,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface InspectionElementProps {
  inspection: InspectionData;
  handleClick(): void;
}

const InspectionElement = ({
  inspection,
  handleClick,
}: InspectionElementProps) => {
  const { t } = useTranslation("dashboard");

  const [imageSrc, setImageSrc] = useState<string>("/img/image.png");
  const pictureSetId = inspection.picture_set_id;
  const [fetchingImages, setFetchingImages] = useState<boolean>(true);

  useEffect(() => {
    if (!pictureSetId) return;

    const controller = new AbortController();
    const signal = controller.signal;
    setFetchingImages(true);

    fetchImages(pictureSetId, signal)
      .then((files) => {
        if (files.length > 0) {
          const imageUrl = URL.createObjectURL(files[0]);
          setImageSrc(imageUrl);
        }
      })
      .catch((error) => {
        if (!axios.isCancel(error)) {
          console.error("Failed to fetch images:", error);
        }
      })
      .finally(() => {
        setFetchingImages(false);
      });

    return () => {
      controller.abort();
    };
  }, [pictureSetId]);

  return (
    <Card
      className={
        "xs:h-[75px] s:h-[100px] flex-shrink-0 cursor-pointer p-2 hover:shadow-xl"
      }
      onClick={handleClick}
    >
      <Stack direction={"row"} className={"h-full items-center"}>
        <Box
          data-testid="image"
          component="div"
          className="flex h-full max-h-full w-[75px] items-center justify-center"
        >
          {fetchingImages ? (
            <CircularProgress size={20}  />
          ) : (
            <img
              src={imageSrc}
              alt={inspection.product_name || "Fertilizer picture"}
              className="h-full max-h-full"
            />
          )}
        </Box>
        <Typography component={"h2"} className={`!ml-2 w-full`}>
          {inspection.product_name}
        </Typography>
        {!inspection.verified && (
          <Tooltip title={t("inspection.unverified")}>
            <ErrorIcon
              data-testid={"error-icon"}
              color="error"
              arial-label={t("inspection.alt.errorIcon")}
            />
          </Tooltip>
        )}
      </Stack>
    </Card>
  );
};

export default InspectionElement;
