import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import FlagIcon from "@mui/icons-material/Flag"
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined"
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  TextareaAutosize,
  Tooltip,
} from "@mui/material"
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

// ============================== Types ==============================
interface LabelDataTextAreaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  fieldName: TName
  label: string
  control: Control<TFieldValues>
  helperText?: string
  error?: boolean
  errorMessage?: string
  needsReview?: boolean
  isSaving?: boolean
  isSaved?: boolean
  hasImages?: boolean
  isExtracting?: boolean
  onExtract?: () => void
  onToggleReview?: () => void
  disabled?: boolean
  minRows?: number
  maxRows?: number
}

// ============================== Component ==============================
export default function LabelDataTextArea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  fieldName,
  label,
  control,
  helperText,
  error = false,
  errorMessage,
  needsReview = false,
  isSaving = false,
  isSaved = false,
  hasImages = false,
  isExtracting = false,
  onExtract,
  onToggleReview,
  disabled = false,
  minRows = 3,
  maxRows = 10,
}: LabelDataTextAreaProps<TFieldValues, TName>) {
  const { t } = useTranslation(["labels", "common"])
  const displayHelperText = error ? errorMessage : helperText
  const trailingAdornments: React.ReactNode[] = []
  if (isSaving) {
    trailingAdornments.push(
      <CircularProgress key="saving" size={16} sx={{ mr: 0.5 }} />,
    )
  } else if (isSaved) {
    trailingAdornments.push(
      <CheckCircleIcon
        key="saved"
        color="success"
        sx={{ fontSize: 18, mr: 0.5 }}
      />,
    )
  }
  if (hasImages && onExtract) {
    const extractButton = (
      <IconButton
        key="extract"
        size="small"
        onClick={onExtract}
        disabled={disabled || isExtracting}
        sx={{ mr: 0.5 }}
      >
        {isExtracting ? (
          <CircularProgress size={16} />
        ) : (
          <AutoAwesomeIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    )
    trailingAdornments.push(
      isExtracting ? (
        <span key="extract-wrapper">{extractButton}</span>
      ) : (
        <Tooltip
          key="extract-tooltip"
          title={t("data.extractField", { ns: "labels" })}
        >
          <span>{extractButton}</span>
        </Tooltip>
      ),
    )
  }
  if (onToggleReview) {
    trailingAdornments.push(
      <Tooltip
        key="review-toggle"
        title={
          needsReview
            ? t("data.removeReviewFlag", { ns: "labels" })
            : t("data.flagForReview", { ns: "labels" })
        }
      >
        <IconButton size="small" onClick={onToggleReview} disabled={disabled}>
          {needsReview ? (
            <FlagIcon color="warning" sx={{ fontSize: 18 }} />
          ) : (
            <FlagOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>,
    )
  }
  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth error={error} disabled={disabled}>
          <InputLabel shrink>{label}</InputLabel>
          <Box sx={{ position: "relative", mt: 2 }}>
            <TextareaAutosize
              {...field}
              minRows={minRows}
              maxRows={maxRows}
              disabled={disabled}
              style={{
                width: "100%",
                padding: "16.5px 14px",
                paddingRight:
                  trailingAdornments.length > 0
                    ? `${14 + trailingAdornments.length * 44}px`
                    : "14px",
                border: error
                  ? "1px solid rgba(211, 47, 47, 0.5)"
                  : "1px solid rgba(0, 0, 0, 0.23)",
                borderRadius: "4px",
                fontFamily: "inherit",
                fontSize: "1rem",
                resize: "vertical",
                ...(error && {
                  borderColor: "rgba(211, 47, 47, 0.5)",
                }),
                ...(disabled && {
                  backgroundColor: "rgba(0, 0, 0, 0.06)",
                }),
              }}
            />
            {trailingAdornments.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  right: 14,
                  top: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  zIndex: 1,
                }}
              >
                {trailingAdornments}
              </Box>
            )}
          </Box>
          {displayHelperText && (
            <FormHelperText>{displayHelperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
