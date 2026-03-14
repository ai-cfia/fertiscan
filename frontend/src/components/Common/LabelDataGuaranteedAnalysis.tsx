import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import FlagIcon from "@mui/icons-material/Flag"
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined"
import {
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormHelperText,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import {
  type Control,
  Controller,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataNameValueList from "./LabelDataNameValueList"

// ============================== Types ==============================
interface LabelDataGuaranteedAnalysisProps<
  TFieldValues extends FieldValues = FieldValues,
> {
  fieldName: keyof TFieldValues
  label: string
  control: Control<TFieldValues>
  form?: UseFormReturn<TFieldValues>
  helperText?: string
  error?: boolean
  errorMessage?: string
  needsReview?: boolean
  hasImages?: boolean
  isExtracting?: boolean
  onExtract?: () => void
  onToggleReview?: () => void
  disabled?: boolean
  readOnly?: boolean
}

// ============================== Component ==============================
export default function LabelDataGuaranteedAnalysis<
  TFieldValues extends FieldValues = FieldValues,
>({
  fieldName,
  label,
  control,
  form,
  helperText,
  error = false,
  errorMessage,
  needsReview = false,
  hasImages = false,
  isExtracting = false,
  onExtract,
  onToggleReview,
  disabled = false,
  readOnly = false,
}: LabelDataGuaranteedAnalysisProps<TFieldValues>) {
  const { t } = useTranslation(["labels", "common"])
  const nutrientsFieldName = `${String(fieldName)}.nutrients` as any
  const displayHelperText = error ? errorMessage : helperText
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          {hasImages &&
            onExtract &&
            (isExtracting ? (
              <IconButton
                size="small"
                onClick={onExtract}
                disabled={disabled || isExtracting}
              >
                <CircularProgress size={16} />
              </IconButton>
            ) : (
              <Tooltip title={t("data.extractField", { ns: "labels" })}>
                <IconButton
                  size="small"
                  onClick={onExtract}
                  disabled={disabled || isExtracting}
                >
                  <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            ))}
          {onToggleReview && (
            <Tooltip
              title={
                needsReview
                  ? t("data.removeReviewFlag", { ns: "labels" })
                  : t("data.flagForReview", { ns: "labels" })
              }
            >
              <IconButton
                size="small"
                onClick={onToggleReview}
                disabled={disabled}
              >
                {needsReview ? (
                  <FlagIcon color="warning" sx={{ fontSize: 18 }} />
                ) : (
                  <FlagOutlinedIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "flex-start" },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Controller
              name={`${String(fieldName)}.title.en` as any}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("data.guaranteedAnalysis.titleEn")}
                  fullWidth
                  size="small"
                  disabled={disabled}
                  onBlur={() => {
                    field.onBlur()
                    if (typeof field.value === "string") {
                      field.onChange(field.value.trim())
                    }
                  }}
                />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Controller
              name={`${String(fieldName)}.title.fr` as any}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("data.guaranteedAnalysis.titleFr")}
                  fullWidth
                  size="small"
                  disabled={disabled}
                  onBlur={() => {
                    field.onBlur()
                    if (typeof field.value === "string") {
                      field.onChange(field.value.trim())
                    }
                  }}
                />
              )}
            />
          </Box>
        </Box>
        <Controller
          name={`${String(fieldName)}.is_minimum` as any}
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={field.value ?? false}
                  disabled={disabled}
                />
              }
              label={t("data.guaranteedAnalysis.isMinimum")}
            />
          )}
        />
        <LabelDataNameValueList
          fieldName={nutrientsFieldName}
          label=""
          control={control}
          form={form}
          disabled={disabled}
          readOnly={readOnly}
          emptyStateMessage={t("data.guaranteedAnalysis.noNutrients")}
          addButtonLabel={t("data.guaranteedAnalysis.addNutrient")}
          nameEnLabel={t("data.guaranteedAnalysis.nameEn")}
          nameFrLabel={t("data.guaranteedAnalysis.nameFr")}
          valueLabel={t("data.guaranteedAnalysis.value")}
          unitLabel={t("data.guaranteedAnalysis.unit")}
        />
      </Box>
      {displayHelperText && (
        <FormHelperText error={error} sx={{ mt: 1 }}>
          {displayHelperText}
        </FormHelperText>
      )}
    </Box>
  )
}
