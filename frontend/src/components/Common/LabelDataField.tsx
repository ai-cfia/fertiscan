import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import FlagIcon from "@mui/icons-material/Flag"
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined"
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
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
interface LabelDataFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  fieldName: TName
  label: string
  control: Control<TFieldValues>
  type?: "text" | "number"
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
  multiline?: boolean
  maxRows?: number
}

// ============================== Component ==============================
export default function LabelDataField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  fieldName,
  label,
  control,
  type = "text",
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
  multiline = false,
  maxRows,
}: LabelDataFieldProps<TFieldValues, TName>) {
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
        <TextField
          {...field}
          label={label}
          type={type}
          fullWidth
          error={error}
          helperText={displayHelperText}
          disabled={disabled}
          value={field.value ?? ""}
          multiline={multiline}
          maxRows={maxRows}
          sx={{
            "& .MuiInputBase-input": {
              color: "text.primary",
            },
            "&.Mui-disabled .MuiInputBase-input": {
              WebkitTextFillColor: "inherit",
              color: "text.primary",
            },
          }}
          onBlur={(_e) => {
            field.onBlur()
            if (typeof field.value === "string") {
              field.onChange(field.value.trim())
            }
          }}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
            input: {
              endAdornment:
                trailingAdornments.length > 0 ? (
                  <InputAdornment position="end">
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {trailingAdornments}
                    </Box>
                  </InputAdornment>
                ) : undefined,
            },
          }}
        />
      )}
    />
  )
}
