"use client";
import LabelDataValidator from "@/components/LabelDataValidator";
import useAlertStore from "@/stores/alertStore";
import useUploadedFilesStore from "@/stores/fileStore";
import { DEFAULT_LABEL_DATA, LabelData } from "@/types/types";
import { getAuthHeader, getLabelDataFromCookies } from "@/utils/client/cookies";
import { fetchImages } from "@/utils/client/requests";
import axios, { AxiosResponse } from "axios";
import Error from "next/error";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LabelDataValidationPageWithId() {
  const { id } = useParams();
  const inspectionId = Array.isArray(id) ? id[0] : id;
  const uploadedFiles = useUploadedFilesStore((state) => state.uploadedFiles);
  const showAlert = useAlertStore((state) => state.showAlert);
  const router = useRouter();
  const [labelData, setLabelData] = useState(DEFAULT_LABEL_DATA);
  const { t } = useTranslation("labelDataValidator");
  const [error, setError] = useState<AxiosResponse | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [fetchingPictures, setFetchingPictures] = useState(true);

  useEffect(() => {
    if (!inspectionId) return;

    const controller = new AbortController();
    const signal = controller.signal;

    axios
      .get(`/api-next/inspections/${inspectionId}`, {
        headers: { Authorization: getAuthHeader() },
        signal,
      })
      .then((response) => {
        const labelData: LabelData = response.data;
        if (labelData.confirmed) {
          showAlert(t("alert.alreadyCompleted"), "warning");
          return router.push("/");
        }
        const c_labelData = getLabelDataFromCookies(inspectionId);
        setLabelData(c_labelData ? c_labelData : labelData);

        if (!labelData.pictureSetId) return;

        setFetchingPictures(true);

        fetchImages(labelData.pictureSetId, signal)
          .then((files) => {
            setImageFiles(files);
          })
          .catch((error) => {
            if (axios.isCancel(error)) console.debug("fetch images aborted");
            else
              showAlert(
                `${t("alert.getPictureSetFailed")}: ${error.message}`,
                "error",
              );
          })
          .finally(() => {
            setFetchingPictures(false);
          });
      })
      .catch((error) => {
        if (axios.isCancel(error)) console.debug("fetch inspection aborted");
        else {
          showAlert(t("alert.failedFetchInspection"), "error");
          setError(error.response);
        }
      });

    return () => {
      controller.abort();
    };
  }, [inspectionId, router, showAlert, uploadedFiles.length, t]);

  return error ? (
    <Error statusCode={error.status} withDarkMode={false} />
  ) : (
    <LabelDataValidator
      labelData={labelData}
      setLabelData={setLabelData}
      inspectionId={inspectionId}
      imageFiles={imageFiles}
      loadingImages={fetchingPictures}
    />
  );
}
