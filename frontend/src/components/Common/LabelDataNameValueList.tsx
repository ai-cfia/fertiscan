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
import { useEffect, useRef } from "react"
import {
  type ArrayPath,
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

// ============================== Types ==============================
interface LabelDataNameValueListProps<
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
  nameEnLabel: string
  nameFrLabel: string
  valueLabel: string
  unitLabel: string
  valueType?: "number" | "text"
  registrationNumberLabel?: string
}

// ============================== Component ==============================
export default function LabelDataNameValueList<
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
  nameEnLabel,
  nameFrLabel,
  valueLabel,
  unitLabel,
  valueType = "number",
  registrationNumberLabel,
}: LabelDataNameValueListProps<TFieldValues, TName>) {
  const { t } = useTranslation(["labels", "common"])
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: fieldName as ArrayPath<TFieldValues>,
  })
  const watchedArray = useWatch({
    control,
    name: fieldName as Path<TFieldValues>,
  }) as any[] | undefined
  const prevFieldsLengthRef = useRef(fields.length)
  useEffect(() => {
    if (
      watchedArray &&
      Array.isArray(watchedArray) &&
      watchedArray.length > 0 &&
      watchedArray.length > fields.length &&
      prevFieldsLengthRef.current === fields.length
    ) {
      replace(watchedArray)
    }
    prevFieldsLengthRef.current = fields.length
  }, [watchedArray, replace, fields.length])
  const displayHelperText = error ? errorMessage : helperText
  const handleAdd = () => {
    append({
      name: { en: "", fr: "" },
      value: "",
      unit: "",
      ...(registrationNumberLabel ? { registration_number: "" } : {}),
    } as Parameters<typeof append>[0])
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
            width: "100%",
            overflowY: "auto",
            pt: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minWidth: { xs: "100%", sm: "800px" },
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
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: "200px",
                    }}
                  >
                    <Controller
                      name={`${fieldName}.${index}.name.en` as any}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={nameEnLabel}
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
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: "200px",
                    }}
                  >
                    <Controller
                      name={`${fieldName}.${index}.name.fr` as any}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={nameFrLabel}
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
                  <Box
                    sx={{
                      flex: 0.4,
                      minWidth: "100px",
                    }}
                  >
                    <Controller
                      name={`${fieldName}.${index}.value` as any}
                      control={control}
                      rules={valueType === "number" ? { min: 0 } : undefined}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={valueLabel}
                          type={valueType}
                          {...(valueType === "number" && {
                            slotProps: {
                              htmlInput: {
                                step: "0.01",
                                min: 0,
                              } as React.InputHTMLAttributes<HTMLInputElement>,
                            },
                          })}
                          fullWidth
                          size="small"
                          disabled={disabled}
                          value={field.value || ""}
                          onChange={(e) => {
                            const val =
                              e.target.value === "" ? "" : e.target.value
                            field.onChange(val)
                          }}
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
                  <Box
                    sx={{
                      flex: 0.3,
                      minWidth: "40px",
                    }}
                  >
                    <Controller
                      name={`${fieldName}.${index}.unit` as any}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={unitLabel}
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
                  {registrationNumberLabel && (
                    <Box
                      sx={{
                        flex: 0.5,
                        minWidth: "120px",
                      }}
                    >
                      <Controller
                        name={
                          `${fieldName}.${index}.registration_number` as any
                        }
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={registrationNumberLabel}
                            fullWidth
                            size="small"
                            disabled={disabled}
                            value={field.value ?? ""}
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
                  )}
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
