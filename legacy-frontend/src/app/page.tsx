"use client";
import Dropzone from "@/components/Dropzone";
import FileList from "@/components/FileList";
import LoadingButton from "@/components/LoadingButton";
import useUploadedFilesStore from "@/stores/fileStore";
import useLabelDataStore from "@/stores/labelDataStore";
import type { DropzoneState } from "@/types/types";
import { Box, Grid2, Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * HomePage component
 *
 * This component represents the home page of the application. It initializes
 * the state for the dropzone and handles the submission of uploaded files.
 *
 * @component
 * @returns {JSX.Element} The rendered home page component.
 *
 * @param {Function} setDropzoneState - Function to update the dropzone state.
 * @param {Array} uploadedFiles - Array of uploaded files.
 * @param {Function} clearUploadedFiles - Function to clear the uploaded files.
 * @param {Function} resetLabelData - Function to reset the label data.
 * @param {boolean} loading - Loading state for the submit button.
 * @param {Function} setLoading - Function to update the loading state.
 * @param {Function} handleSubmission - Function to handle the submission of uploaded files.
 */
const HomePage = () => {
  const { t } = useTranslation("homePage");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [dropzoneState, setDropzoneState] = useState<DropzoneState>({
    visible: false,
    imageUrl: null,
    fillPercentage: 0,
  });

  const uploadedFiles = useUploadedFilesStore((state) => state.uploadedFiles);
  const clearUploadedFiles = useUploadedFilesStore(
    (state) => state.clearUploadedFiles,
  );
  const resetLabelData = useLabelDataStore((state) => state.resetLabelData);

  useEffect(() => {
    clearUploadedFiles();
    resetLabelData();
  }, [clearUploadedFiles, resetLabelData]);

  const handleSubmission = () => {
    setLoading(true);
    router.push("/label-data-validation");
  };

  return (
    <Suspense fallback="loading">
      <Box className="pt-[10vh]">
        <Grid2
          className="h-[80vh] justify-center"
          container
          rowSpacing={1}
          columnSpacing={{ xs: 1, sm: 2, md: 3 }}
        >
          <Grid2
            className="content-end justify-center"
            container
            size={{ xs: 10, md: 7 }}
          >
            <Dropzone
              dropzoneState={dropzoneState}
              setDropzoneState={setDropzoneState}
            />
          </Grid2>
          <Grid2
            className="flex content-end justify-center"
            container
            size={{ xs: 10, md: 4 }}
          >
            <FileList setDropzoneState={setDropzoneState} />
          </Grid2>
          <Grid2
            sx={{ display: { xs: "none", md: "flex" } }}
            size={{ xs: 10, md: 7 }}
          />
          <Grid2
            className="justify-center xs:flex md:flow-root"
            size={{ xs: 9, md: 4 }}
          >
            <Tooltip
              data-testid="hint-submit-button-disabled"
              title={t("submitButtonDisabledHint")}
              disableHoverListener={uploadedFiles.length !== 0}
              placement="top"
              className="w-[90%] min-w-[133.44px] max-w-full"
            >
              <span className="flex w-full justify-center">
                <LoadingButton
                  className="max-h-[40px] min-w-[133.44px] xs:w-[90%] md:w-[100%] md:max-w-[470px]" // do not modify md:max-w-[470px] so that the button keeps the same width as the FileList
                  data-testid="submit-button"
                  variant="contained"
                  color="secondary"
                  disabled={uploadedFiles.length === 0}
                  fullWidth
                  onClick={handleSubmission}
                  loading={loading}
                  text={t("submitButton")}
                />
              </span>
            </Tooltip>
          </Grid2>
        </Grid2>
      </Box>
    </Suspense>
  );
}
export default HomePage;
