"use client";
import LabelDataValidator from "@/components/LabelDataValidator";
import useAlertStore from "@/stores/alertStore";
import useUploadedFilesStore from "@/stores/fileStore";
import useLabelDataStore from "@/stores/labelDataStore";
import { DEFAULT_LABEL_DATA, LabelData } from "@/types/types";
import { processAxiosError } from "@/utils/client/apiErrors";
import { getAuthHeader } from "@/utils/client/cookies";
import axios from "axios";
import Error from "next/error";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * A React component that handles the validation process for label data.
 * It manages the flow of uploading files, extracting label data from them,
 * and navigating to the validation detail page.
 *
 * @returns {JSX.Element} The rendered LabelDataValidationPage component.
 */
const LabelDataValidationPage = () => {
  const uploadedFiles = useUploadedFilesStore((state) => state.uploadedFiles);
  const storedLabelData = useLabelDataStore((state) => state.labelData);
  const [labelData, setLabelData] = useState(DEFAULT_LABEL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const showAlert = useAlertStore((state) => state.showAlert);
  const router = useRouter();
  const { t } = useTranslation("labelDataValidator");
  const imageFiles = uploadedFiles.map((file) => file.getFile());

  // Check if no files were uploaded
  useEffect(() => {
    if (uploadedFiles.length === 0) {
      showAlert(t("errors.noFileUploaded"), "warning");
      router.push("/");
      return;
    }

    if (storedLabelData) {
      setLabelData(storedLabelData);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    setLoading(true);
    const formData = new FormData();

    uploadedFiles.forEach((fileUploaded) => {
      const file = fileUploaded.getFile();
      formData.append("files", file);
    });

    axios
      .post("/api-next/extract-label-data", formData, {
        headers: { Authorization: getAuthHeader() },
        signal,
      })
      .then(async (response) => {
        const labelData: LabelData = response.data;

        if (!labelData.pictureSetId) {
          setError(true);
          return;
        }

        showAlert(t("alert.labelExtractionSuccess"), "success");
        axios
          .post("/api-next/inspections", labelData, {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
            signal,
          })
          .then((response) => {
            showAlert(t("alert.initialSaveSuccess"), "success");
            const labelData: LabelData = response.data;
            router.push(`/label-data-validation/${labelData.inspectionId}`);
          })
          .catch((error) => {
            if (axios.isCancel(error)) console.log("request canceled");
            else {
              showAlert(
                `${t("alert.initialSaveFailed")}: ${processAxiosError(error)}`,
                "error",
              );
              setLoading(false);
            }
          })
          .finally(() => {
            setLabelData(labelData);
            // not disabling loading here in case of strict mode abort
          });
      })
      .catch((error) => {
        if (axios.isCancel(error)) console.log("request canceled");
        else {
          showAlert(
            `${t("alert.labelExtractionFailed")}: ${processAxiosError(error)}`,
            "error",
          );
          setLoading(false);
        }
      });
    return () => {
      controller.abort(); // avoids react strict mode double fetch
    };
  }, [uploadedFiles, showAlert, router, storedLabelData, setLabelData, t]);

  return error ? (
    <Error
      statusCode={500}
      title={t("errors.folderCreationFailed")}
      withDarkMode={false}
    />
  ) : (
    <LabelDataValidator
      imageFiles={imageFiles}
      labelData={labelData}
      setLabelData={setLabelData}
      loadingFieldsData={loading}
    />
  );
};

export default LabelDataValidationPage;
