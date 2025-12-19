"use client";
import LabelInformation from "@/components/inspection-details/LabelInformation";
import SplitContentLayout from "@/components/inspection-details/SplitContentLayout";
import LoadingButton from "@/components/LoadingButton";
import useAlertStore from "@/stores/alertStore";
import { LabelData } from "@/types/types";
import { processAxiosError } from "@/utils/client/apiErrors";
import { getAuthHeader } from "@/utils/client/cookies";
import { fetchImages } from "@/utils/client/requests";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import axios, { AxiosResponse } from "axios";
import Error from "next/error";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * InspectionPage component renders the inspection details page.
 * It fetches inspection data based on the inspection ID from the URL parameters.
 * It provides functionalities to edit or discard the inspection.
 *
 * @component
 * @returns {JSX.Element} The rendered inspection page component.
 *
 * @function deleteInspection
 * Deletes an inspection by making a DELETE request to the API.
 * @param {string} id - The ID of the inspection to delete.
 * @param {AbortSignal} signal - The abort signal to cancel the request if needed.
 *
 * @function handleEditClick
 * Navigates to the label data validation page for editing the inspection.
 *
 * @function handleDiscardClick
 * Opens the confirmation dialog for discarding the inspection.
 *
 * @function confirmDiscard
 * Confirms the discard action and deletes the inspection.
 *
 * @hook useEffect
 * Fetches the inspection data when the component mounts or the inspection ID changes.
 *
 */
const InspectionPage = () => {
  const { t } = useTranslation("inspectionPage");
  const { id } = useParams();
  const inspectionId = Array.isArray(id) ? id[0] : id;
  const [editLoading, setEditLoading] = useState(false);
  const [discardLoading, setDiscardLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const showAlert = useAlertStore((state) => state.showAlert);
  const [labelData, setLabelData] = useState<LabelData | null>(null);
  const [error, setError] = useState<AxiosResponse | null>(null);
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fetchingInspection, setFetchingInspection] = useState(true);
  const [fetchingPictures, setFetchingPictures] = useState(true);

  const deleteInspection = (id: string, signal: AbortSignal) => {
    axios
      .delete(`/api-next/inspections/${id}`, {
        headers: { Authorization: getAuthHeader() },
        signal,
      })
      .then(() => {
        showAlert(t("alert.deleteSuccess"), "success");
        router.push("/");
      })
      .catch((error) => {
        showAlert(
          `${t("alert.discardFailed")}: ${processAxiosError(error)}`,
          "error",
        );
        setDiscardLoading(false);
      });
  };

  useEffect(() => {
    if (!inspectionId) return;

    const controller = new AbortController();
    const signal = controller.signal;
    setFetchingInspection(true);

    axios
      .get(`/api-next/inspections/${inspectionId}`, {
        headers: { Authorization: getAuthHeader() },
        signal,
      })
      .then((response) => {
        setLabelData(response.data);
        setFetchingInspection(false);

        if (!response.data.pictureSetId) return;

        setFetchingPictures(true);

        fetchImages(response.data.pictureSetId, signal)
          .then((files) => {
            setImageFiles(files);
          })
          .catch((error) => {
            showAlert(
              `${t("alert.getPictureSetFailed")}: ${processAxiosError(error)}`,
              "error",
            );
          })
          .finally(() => {
            setFetchingPictures(false);
          });
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.debug("fetch aborted");
          return;
        }
        showAlert(
          `${t("alert.getInspectionFailed")}: ${processAxiosError(error)}`,
          "error",
        );
        setError(error.response);
      })
      .finally(() => {
        setFetchingInspection(false);
      });

    return () => {
      controller.abort();
    };
  }, [inspectionId, showAlert, t]);

  const handleEditClick = () => {
    setEditLoading(true);
    router.push(`/label-data-validation/${labelData?.inspectionId}`);
  };

  const handleDiscardClick = () => {
    setConfirmOpen(true);
  };

  const confirmDiscard = () => {
    setConfirmOpen(false);
    if (!inspectionId) {
      showAlert(t("alert.internalErrorLabelNotFound"), "error");
      return;
    }
    setDiscardLoading(true);
    deleteInspection(inspectionId, new AbortController().signal);
  };

  return error ? (
    <Error statusCode={error.status} withDarkMode={false}/>
  ) : (
    <Container
      className="h-min-[calc(100vh-65px)] flex max-w-[1920px] flex-col bg-gray-100 text-black"
      maxWidth={false}
      data-testid="label-data-validator-container"
    >
      <SplitContentLayout
        imageFiles={imageFiles}
        expandable
        header={
          <Box className="mx-auto flex w-full flex-col rounded-sm bg-gray-100 p-4 text-left shadow-md">
            <Typography variant="h5" className="!font-bold">
              {t("inspectionDetails")}
            </Typography>
            <Box className="mt-3 grid w-full grid-cols-2 gap-4">
              <Typography variant="body1">
                <strong>{t("inspectionId")}:</strong> {labelData?.inspectionId}
              </Typography>
              <Typography variant="body1">
                <strong>{t("inspector")}:</strong> {}
              </Typography>
              <Typography variant="body1">
                <strong>{t("status")}:</strong>{" "}
                <span
                  className={
                    labelData?.confirmed ? "text-green-600" : "text-red-600"
                  }
                >
                  {labelData?.confirmed ? t("completed") : t("incomplete")}
                </span>
              </Typography>
              <Typography variant="body1">
                <strong>{t("createdAt")}:</strong>
                {}
              </Typography>
              <Typography variant="body1">
                <strong>{t("lastUpdatedAt")}:</strong>{" "}
              </Typography>
            </Box>
          </Box>
        }
        body={<LabelInformation labelData={labelData} disableNotes={true} />}
        footer={
          <Box className="flex items-center justify-center gap-4 p-4">
            <LoadingButton
              variant="contained"
              color="secondary"
              onClick={handleEditClick}
              data-testid="edit-button"
              loading={editLoading}
              text={t("edit")}
              aria-label={t("alt.edit")}
              disabled={labelData?.confirmed}
            />
            <LoadingButton
              variant="contained"
              color="error"
              onClick={handleDiscardClick}
              data-testid="discard-button"
              text={t("discard")}
              aria-label={t("alt.discard")}
              disabled={labelData?.confirmed}
              loading={discardLoading}
            />
          </Box>
        }
        loadingRightSection={fetchingInspection}
        loadingImageViewer={fetchingInspection || fetchingPictures}
      />
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t("confirmDiscardTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t("confirmDiscardMessage")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            {t("cancel")}
          </Button>
          <Button onClick={confirmDiscard} color="error" autoFocus>
            {t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InspectionPage;
