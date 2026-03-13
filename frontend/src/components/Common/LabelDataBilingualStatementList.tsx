import AddIcon from "@mui/icons-material/Add"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import DeleteIcon from "@mui/icons-material/Delete"
import FlagIcon from "@mui/icons-material/Flag"
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined"
import {
  Box,
  Button,
  CircularProgress,
  FormHelperText,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import {
  type ArrayPath,
  type Control,
  Controller,
  type FieldValues,
  type UseFormReturn,
  useFieldArray,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

// ============================== Types ==============================
interface LabelDataBilingualStatementListProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> {
  fieldName: TName
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
  emptyStateMessage: string
  addButtonLabel: string
  enLabel: string
  frLabel: string
}

// ============================== Component ==============================
export default function LabelDataBilingualStatementList<
  TFieldValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
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
  emptyStateMessage,
  addButtonLabel,
  enLabel,
  frLabel,
}: LabelDataBilingualStatementListProps<TFieldValues, TName>) {
  const { t } = useTranslation(["labels", "common"])
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName as ArrayPath<TFieldValues>,
  })
  const displayHelperText = error ? errorMessage : helperText
  const handleAdd = () => {
    append({ en: "", fr: "" } as Parameters<typeof append>[0])
  }
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
      {fields.length === 0 ? (
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 2,
            textAlign: "center",
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {emptyStateMessage}
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={disabled}
            variant="outlined"
          >
            {addButtonLabel}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {fields.map((field, index) => (
            <Box key={field.id}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "flex-start" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: "200px" }}>
                  <Controller
                    name={`${String(fieldName)}.${index}.en` as any}
                    control={control}
                    render={({ field: f }) => (
                      <TextField
                        {...f}
                        label={enLabel}
                        fullWidth
                        size="small"
                        multiline
                        maxRows={4}
                        disabled={disabled}
                        value={f.value ?? ""}
                        onBlur={() => {
                          f.onBlur()
                          if (typeof f.value === "string") {
                            f.onChange(f.value.trim())
                          }
                        }}
                      />
                    )}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: "200px" }}>
                  <Controller
                    name={`${String(fieldName)}.${index}.fr` as any}
                    control={control}
                    render={({ field: f }) => (
                      <TextField
                        {...f}
                        label={frLabel}
                        fullWidth
                        size="small"
                        multiline
                        maxRows={4}
                        disabled={disabled}
                        value={f.value ?? ""}
                        onBlur={() => {
                          f.onBlur()
                          if (typeof f.value === "string") {
                            f.onChange(f.value.trim())
                          }
                        }}
                      />
                    )}
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    remove(index)
                    if (form) {
                      const currentValue = form.getValues(fieldName as any)
                      form.setValue(fieldName as any, currentValue, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
                  }}
                  disabled={disabled}
                  color="error"
                  sx={{
                    alignSelf: { xs: "flex-start", sm: "center" },
                    flexShrink: 0,
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={disabled}
            variant="outlined"
            size="small"
          >
            {addButtonLabel}
          </Button>
        </Box>
      )}
      {displayHelperText && (
        <FormHelperText error={error} sx={{ mt: 1 }}>
          {displayHelperText}
        </FormHelperText>
      )}
    </Box>
  )
}
