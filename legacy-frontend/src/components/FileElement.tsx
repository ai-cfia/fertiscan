import FileUploaded from "@/classes/File";
import useUploadedFilesStore from "@/stores/fileStore";
import { DropzoneState } from "@/types/types";
import CheckIcon from "@mui/icons-material/Check";
import CreateIcon from "@mui/icons-material/Create";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Divider,
  Grid2,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * FileElementProps interface to define the props for the FileElement component
 *
 * @interface FileElementProps
 * @property {React.Dispatch<React.SetStateAction<DropzoneState>>} setDropzoneState - Function to set the dropzone state
 * @property {FileUploaded} imageFile - The uploaded file
 */
interface FileElementProps {
  setDropzoneState: React.Dispatch<React.SetStateAction<DropzoneState>>;
  imageFile: FileUploaded;
}

/**
 *
 * FileElement component to display the uploaded file
 *
 * @component
 * @param {FileElementProps} props - The props for the FileElement component
 * @param {React.Dispatch<React.SetStateAction<DropzoneState>>} props.setDropzoneState - Function to set the dropzone state
 * @param {FileUploaded} props.imageFile - The uploaded file
 * @returns {JSX.Element} The rendered FileElement component
 */
const FileElement: React.FC<FileElementProps> = ({
  setDropzoneState,
  imageFile,
}) => {
  const { t } = useTranslation("homePage");
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const { removeUploadedFile, renameUploadedFile } = useUploadedFilesStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const { name: imageName, path: imageUrl } = imageFile.getInfo();
  const extension = imageName.split(".").pop() || "";
  const baseName =
    imageName.substring(0, imageName.lastIndexOf(".")) || imageName;
  const [newName, setNewName] = useState(baseName);

  /**
   * Handle the rename submit event
   *
   * @param {React.KeyboardEvent} event - The keyboard event (Enter)
   * @returns {void}
   */
  const handleRenameSubmit = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && newName.trim() !== "") {
      renameUploadedFile(imageUrl, `${newName.trim()}.${extension}`);
    }
  };

  return (
    <>
      <Grid2
        onMouseEnter={() => {
          setHovered(true);
          setDropzoneState({ visible: true, imageUrl: imageUrl });
        }}
        onMouseLeave={() => {
          setHovered(false);
          setDropzoneState({ visible: false, imageUrl: "" });
        }}
        className="relative flex h-full min-h-[90px] w-full items-center justify-center overflow-hidden rounded border-2 border-neutral-600 bg-neutral-200"
        data-testid={`file-element-${imageName}`}
      >
        <Grid2 size={20} className="relative flex items-center justify-center">
          <div>
            <Image
              className="!relative max-h-[90px] max-w-full p-1"
              src={imageUrl}
              alt={t("fileElement.altText.uploadedFileAlt")}
              fill={true}
              priority
              data-testid="logo-image"
            />
          </div>
        </Grid2>
        <Divider
          orientation="vertical"
          flexItem
          color={theme.palette.primary.dark}
          sx={{ borderRightWidth: 3 }} // className="border-r-2" dont work
        />
        <Grid2 size={80} className="relative flex items-center justify-between">
          {isRenaming ? (
            <div className="flex w-full items-center">
              <TextField
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={handleRenameSubmit}
                autoFocus
                placeholder={t("fileElement.altText.enterFileName")}
                slotProps={{
                  htmlInput: {
                    autoComplete: "off",
                  },
                }}
                style={{
                  marginLeft: "5px",
                  marginRight: "5px",
                  width: "calc(100% - 45px)",
                }}
                data-testid="rename-input"
              />
              <Typography
                variant="body1"
                color={theme.palette.text.primary}
                style={{
                  whiteSpace: "nowrap",
                  marginRight: "5px",
                  flexShrink: 0,
                  width: "auto",
                }}
              >
                .{extension}
              </Typography>
              <IconButton
                edge="end"
                size="small"
                aria-label={t("fileElement.altText.renameFileAlt")}
                sx={{
                  color: "black",
                  backgroundColor: "#D3D3D3",
                  borderRadius: "5px",
                  marginRight: "0.5rem",
                  "&:hover": {
                    backgroundColor: "#A9A9A9",
                  },
                }}
                onClick={() => {
                  setIsRenaming(false);
                  renameUploadedFile(
                    imageUrl,
                    `${newName.trim()}.${extension}`,
                  );
                }}
                data-testid={`rename-submit`}
              >
                <CheckIcon style={{ fontSize: "1.7rem" }} />
              </IconButton>
            </div>
          ) : (
            <Typography
              variant="h6"
              color={theme.palette.text.primary}
              className="overflow-hidden pl-2 text-start text-ellipsis whitespace-nowrap"
              sx={{ maxWidth: { xs: "80%", md: "calc(100% - 75px)" } }}
              data-testid="file-name"
            >
              {imageName}
            </Typography>
          )}
        </Grid2>
        {!isRenaming && hovered && (
          <>
            <IconButton
              edge="end"
              aria-label={t("fileElement.altText.deleteFileAlt")}
              size="small"
              sx={{
                alignSelf: "center",
                display: "flex",
                maxHeight: "50%",
                color: "black",
                position: "absolute",
                borderRadius: "5px",
                right: { xs: 5, sm: 5 },
                top: { xs: 0, sm: "0" },
                bottom: { xs: "auto", sm: 10 },
                "&:hover": {
                  backgroundColor: "#A9A9A9",
                },
              }}
              onClick={() => {
                removeUploadedFile(imageUrl);
                setDropzoneState({ visible: false, imageUrl: "" });
              }}
              data-testid={`delete-${imageName}`}
            >
              <DeleteIcon
                data-testid="delete-icon"
                style={{ fontSize: "1.7rem" }}
              />
            </IconButton>
            <IconButton
              edge="end"
              size="small"
              aria-label={t("fileElement.altText.renameFileAlt")}
              sx={{
                alignSelf: "center",
                display: "flex",
                maxHeight: "50%",
                color: "black",
                position: "absolute",
                borderRadius: "5px",
                right: { xs: 6, sm: 45 },
                top: { xs: 50, sm: "0" },
                bottom: { xs: "auto", sm: 10 },
                "&:hover": {
                  backgroundColor: "#A9A9A9",
                },
              }}
              onClick={() => setIsRenaming(true)}
              data-testid={`rename-${imageName}`}
            >
              <CreateIcon
                data-testid={`rename-icon`}
                style={{ fontSize: "1.7rem" }}
              />
            </IconButton>
          </>
        )}
      </Grid2>
    </>
  );
};

export default FileElement;
