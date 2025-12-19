"use client";
import FileUploaded from "@/classes/File";
import useAlertStore from "@/stores/alertStore";
import useUploadedFilesStore from "@/stores/fileStore";
import type { DropzoneState } from "@/types/types";
import { CloudUpload } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the Dropzone component.
 *
 * @interface DropzoneProps
 *
 * @property {DropzoneState} dropzoneState - State of the dropzone.
 * @property {React.Dispatch<React.SetStateAction<DropzoneState>>} setDropzoneState - Function to update the dropzone state.
 */
interface DropzoneProps {
  dropzoneState: DropzoneState;
  setDropzoneState: React.Dispatch<React.SetStateAction<DropzoneState>>;
}

/**
 * Dropzone component for handling file uploads via drag-and-drop or file selection.
 *
 * @component
 * @param {DropzoneProps} props - The props for the Dropzone component.
 * @param {DropzoneState} props.dropzoneState - State of the dropzone.
 * @returns {JSX.Element} The rendered Dropzone component.
 *
 * @property {FileUploaded[]} uploadedFiles - An array of uploaded files.
 * @property {React.Dispatch<React.SetStateAction<FileUploaded[]>>} setUploadedFiles - Function to update the uploaded files state.
 * @property {DropzoneState} dropzoneState - State of the dropzone.
 * @property {React.Dispatch<React.SetStateAction<DropzoneState>>} setDropzoneState - Function to update the dropzone state.
 */
const Dropzone: React.FC<DropzoneProps> = ({ dropzoneState }) => {
  const theme = useTheme();
  const { t: tHomePage } = useTranslation("homePage");
  const { t: tAlertBanner } = useTranslation("alertBanner");
  const { showAlert } = useAlertStore();

  const allowedImagesExtensions = [".png", ".jpg", ".jpeg"];

  const { uploadedFiles, addUploadedFile } = useUploadedFilesStore();

  // Handle the drag over event
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Handle the drop event
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const items = event.dataTransfer.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
          traverseFileTree(item);
        }
      }
    }
  };

  // Traverse the file tree and process files
  const traverseFileTree = async (item: FileSystemEntry) => {
    if (item.isFile) {
      const fileEntry = item as FileSystemFileEntry;
      fileEntry.file((file: File) => {
        if (allowedImagesExtensions.some((ext) => file.name.endsWith(ext))) {
          processFile(file);
        }
      });
    } else if (item.isDirectory) {
      const dirEntry = item as FileSystemDirectoryEntry;
      const dirReader = dirEntry.createReader();
      dirReader.readEntries((entries: FileSystemEntry[]) => {
        for (let i = 0; i < entries.length; i++) {
          traverseFileTree(entries[i]);
        }
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        processFile(files[i]);
      }
    }
  };

  /**
   * Process the file and add it to the uploaded files.
   * If the file already exists, show an error alert.
   * If the file is a PDF, show an info alert.
   *
   * @param {File} file - The file to process.
   */
  const processFile = async (file: File) => {
    const alreadyExists = uploadedFiles.some(
      (uploadedFile) => uploadedFile.getInfo().name === file.name,
    );

    if (alreadyExists) {
      showAlert(tAlertBanner("fileExists"), "error");
      return;
    }

    const newFile = new FileUploaded(
      { username: "user" },
      URL.createObjectURL(file),
      file,
    );

    const detectedType = await FileUploaded.detectType(newFile.getInfo().path);
    if (typeof detectedType === "object" && detectedType.type === "pdf") {
      showAlert(tAlertBanner("pdfNotSupported"), "info");
    } else {
      addUploadedFile(newFile);
    }
  };

  return (
    <Box
      data-testid="dropzone"
      id="dropzone"
      className="xs:min-h-[350px] relative flex h-[90%] w-[90%] min-w-[133.44px] flex-col items-center justify-center rounded border-4 border-dashed border-sky-900 bg-transparent bg-contain p-1 text-center md:min-h-[400px]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {dropzoneState.visible && dropzoneState.imageUrl ? (
        <Box
          data-testid="hovered-image"
          component="img"
          src={dropzoneState.imageUrl}
          alt={tHomePage("altText.hoveredImageAlt")}
          className="absolute h-auto max-h-full w-auto max-w-full object-contain"
        />
      ) : (
        <Box className="text-center">
          <CloudUpload
            aria-label={tHomePage("dropzone.altText.CloudIconAlt")}
            style={{
              color: theme.palette.secondary.main,
              fontSize: "7rem",
            }}
          />
          <Typography
            className="select-none"
            variant="h5"
            color={theme.palette.secondary.main}
          >
            <b>{tHomePage("dropzone.dragDrop")}</b>
          </Typography>
          <Typography
            className="select-none"
            variant="h5"
            color={theme.palette.secondary.main}
          >
            <b>{tHomePage("dropzone.or")}</b>
          </Typography>
          <Button
            className="select-none"
            variant="contained"
            color="secondary"
            role="button"
            onClick={() => document.getElementById("File type")?.click()}
          >
            <b>{tHomePage("dropzone.browseFile")}</b>
            <input
              id="File type"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              multiple
              hidden
              onChange={handleFileUpload}
              data-testid="browse-file-button"
            />
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Dropzone;
