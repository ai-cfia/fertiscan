import AddIcon from "@mui/icons-material/Add"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import DeleteIcon from "@mui/icons-material/Delete"
import FlagIcon from "@mui/icons-material/Flag"
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined"
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import {
  type ArrayPath,
  type Control,
  Controller,
  type FieldValues,
  useFieldArray,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

// ============================== Types ==============================
interface LabelDataContactsProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> {
  fieldName: TName
  label: string
  control: Control<TFieldValues>
  helperText?: string
  error?: boolean
  errorMessage?: string
  needsReview?: boolean
  hasImages?: boolean
  isExtracting?: boolean
  onExtract?: () => void
  onToggleReview?: () => void
  disabled?: boolean
}

// ============================== Component ==============================
export default function LabelDataContacts<
  TFieldValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
>({
  fieldName,
  label,
  control,
  helperText,
  error = false,
  errorMessage,
  needsReview = false,
  hasImages = false,
  isExtracting = false,
  onExtract,
  onToggleReview,
  disabled = false,
}: LabelDataContactsProps<TFieldValues, TName>) {
  const { t } = useTranslation(["labels", "common"])
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  })
  const displayHelperText = error ? errorMessage : helperText
  const contactTypes = [
    { value: "", label: t("data.contacts.types.notSpecified") },
    { value: "manufacturer", label: t("data.contacts.types.manufacturer") },
    { value: "distributor", label: t("data.contacts.types.distributor") },
    { value: "importer", label: t("data.contacts.types.importer") },
  ]
  const handleAddContact = () => {
    append({
      type: "",
      name: "",
      address: null,
      phone: null,
      email: null,
      website: null,
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
            {t("data.contacts.noContacts")}
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddContact}
            disabled={disabled}
            variant="outlined"
          >
            {t("data.contacts.addContact")}
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {fields.map((field, index) => (
            <Card
              key={field.id}
              variant="outlined"
              sx={{ bgcolor: "transparent" }}
            >
              <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("data.contacts.contactNumber", { number: index + 1 })}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => remove(index)}
                    disabled={disabled}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", lg: "row" },
                    }}
                  >
                    <Box sx={{ flex: { xs: 1, lg: 0.3 } }}>
                      <Controller
                        name={`${fieldName}.${index}.type` as any}
                        control={control}
                        render={({ field: typeField }) => (
                          <FormControl fullWidth size="small">
                            <InputLabel>{t("data.contacts.type")}</InputLabel>
                            <Select
                              {...typeField}
                              value={typeField.value || ""}
                              onChange={(e) => {
                                const value =
                                  e.target.value === "" ? null : e.target.value
                                typeField.onChange(value)
                              }}
                              label={t("data.contacts.type")}
                              disabled={disabled}
                            >
                              {contactTypes.map((option) => (
                                <MenuItem
                                  key={option.value || "empty"}
                                  value={option.value}
                                >
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Box>
                    <Box sx={{ flex: { xs: 1, lg: 0.7 } }}>
                      <Controller
                        name={`${fieldName}.${index}.name` as any}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: nameField }) => (
                          <TextField
                            {...nameField}
                            label={t("data.contacts.name")}
                            fullWidth
                            size="small"
                            required
                            disabled={disabled}
                          />
                        )}
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", lg: "row" },
                    }}
                  >
                    <Box sx={{ flex: { xs: 1, lg: 2 } }}>
                      <Controller
                        name={`${fieldName}.${index}.address` as any}
                        control={control}
                        render={({ field: addressField }) => (
                          <TextField
                            {...addressField}
                            value={addressField.value || ""}
                            label={t("data.contacts.address")}
                            fullWidth
                            size="small"
                            disabled={disabled}
                          />
                        )}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name={`${fieldName}.${index}.phone` as any}
                        control={control}
                        render={({ field: phoneField }) => (
                          <TextField
                            {...phoneField}
                            value={phoneField.value || ""}
                            label={t("data.contacts.phone")}
                            fullWidth
                            size="small"
                            disabled={disabled}
                          />
                        )}
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", lg: "row" },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name={`${fieldName}.${index}.website` as any}
                        control={control}
                        render={({ field: websiteField }) => (
                          <TextField
                            {...websiteField}
                            value={websiteField.value || ""}
                            label={t("data.contacts.website")}
                            type="url"
                            fullWidth
                            size="small"
                            disabled={disabled}
                          />
                        )}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name={`${fieldName}.${index}.email` as any}
                        control={control}
                        render={({ field: emailField }) => (
                          <TextField
                            {...emailField}
                            value={emailField.value || ""}
                            label={t("data.contacts.email")}
                            type="email"
                            fullWidth
                            size="small"
                            disabled={disabled}
                          />
                        )}
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddContact}
            disabled={disabled}
            variant="outlined"
            size="small"
          >
            {t("data.contacts.addContact")}
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
