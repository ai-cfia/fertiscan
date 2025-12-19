"use client";
import FileElement from "@/components/FileElement";
import useUploadedFilesStore from "@/stores/fileStore";
import { DropzoneState } from "@/types/types"; // Adjust the import path as necessary
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the FileList component.
 *
 * @interface FileListProps
 * @property {React.Dispatch<React.SetStateAction<DropzoneState>>} setDropzoneState - Function to set the state of the dropzone.
 */
interface FileListProps {
  setDropzoneState: React.Dispatch<React.SetStateAction<DropzoneState>>;
}

/**
 * FileList component displays a list of uploaded files with options to delete them.
 * It also handles the state of the dropzone.
 *
 * @component
 * @param {FileListProps} props - The properties for the FileList component.
 * @param {Array} props.uploadedFiles - An array of uploaded file objects.
 * @param {Function} props.setUploadedFiles - Function to update the uploaded files state.
 * @param {Function} props.handleSetDropzoneState - Function to set the state of the dropzone.
 * @returns {JSX.Element} The rendered FileList component.
 */
const FileList: React.FC<FileListProps> = ({ setDropzoneState }) => {
  const { t } = useTranslation("homePage");
  const theme = useTheme();
  const { uploadedFiles, clearUploadedFiles } = useUploadedFilesStore();

  return (
    <Suspense fallback="loading">
      <Box
        sx={{
          "&::-webkit-scrollbar": {
            width: "10px",
            marginRight: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#075985", // This matches the border-sky-900 color
            borderRadius: "9999px", // This is 'rounded-full' in Tailwind
            border: "6px solid transparent", // This is border-6 in Tailwind
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
        className={`xs:w-[90%] xs:min-h-[350px] relative flex h-[90%] min-w-[133.44px] flex-col items-center overflow-x-hidden overflow-y-auto rounded border-2 border-sky-900 bg-transparent bg-contain p-1 text-center md:min-h-[400px] md:w-[100%] md:max-w-[470px]`} // do not modify md:max-w-[470px] so that the fileList does not become to big
      >
        <Box
          className={`absolute flex h-full w-full transform flex-col ${
            uploadedFiles.length === 0
              ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 justify-center p-0"
              : "translate-x-none translate-y-none top-0 left-0 items-start justify-start p-2"
          } max-h-full max-w-full object-contain text-center`}
        >
          <Typography
            className="select-none"
            variant="h5"
            color={theme.palette.text.primary}
            gutterBottom
          >
            <b>
              {uploadedFiles.length > 0
                ? t("fileList.uploadedfiles") +
                  " (" +
                  uploadedFiles.length +
                  ")"
                : t("fileList.noUploadedfiles")}
            </b>
          </Typography>
          {uploadedFiles.length > 1 && (
            <Button
              variant="contained"
              color="secondary"
              onClick={clearUploadedFiles}
              className="mb-4"
              sx={{
                fontSize: "0.6rem",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                marginLeft: "auto",
              }}
              aria-label={t("fileList.alt.deleteAllIcon")}
            >
              {t("fileList.deleteAll")}
            </Button>
          )}
          <Stack
            className="flex w-full flex-col"
            direction="column"
            spacing={2}
          >
            {uploadedFiles.map((file, index) => (
              <FileElement
                key={index}
                setDropzoneState={setDropzoneState}
                imageFile={file}
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </Suspense>
  );
};

export default FileList;
