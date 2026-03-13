import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import FlagIcon from "@mui/icons-material/Flag"
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined"
import {
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
} from "@mui/material"
import type { Control } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataAccordionSection from "@/components/Common/LabelDataAccordionSection"
import LabelDataContacts from "@/components/Common/LabelDataContacts"
import LabelDataField from "@/components/Common/LabelDataField"

const PRODUCT_CLASSIFICATIONS = [
  "fertilizer",
  "supplement",
  "growing_medium",
  "treated_seed",
] as const

// ============================== Basic Information Section ==============================
interface BasicInformationSectionProps {
  control: Control<any>
  accordionState: boolean
  onAccordionChange: (isExpanded: boolean) => void
  getFieldMeta: (formPath: string) => {
    needs_review: boolean
  }
  hasImages: boolean
  getIsFieldExtracting: (formPath: string) => boolean
  onExtractField: (fieldName: string | string[] | null) => void
  onToggleReview: (formPath: string) => void
  isFertilizer?: boolean
  disabled?: boolean
}
export default function BasicInformationSection({
  control,
  accordionState,
  onAccordionChange,
  getFieldMeta,
  hasImages,
  getIsFieldExtracting,
  onExtractField,
  onToggleReview,
  isFertilizer = true,
  disabled = false,
}: BasicInformationSectionProps) {
  const { t } = useTranslation("labels")
  const basicFields = [
    "product_name",
    "brand_name",
    "contacts",
    "registration_number",
    "registration_claim",
    "lot_number",
    "net_weight",
    "volume",
    "exemption_claim",
    "country_of_origin",
    "product_classification",
  ]
  const isExtractingAny = basicFields.some((field) =>
    getIsFieldExtracting(field),
  )
  const extractButton =
    hasImages && !disabled ? (
      isExtractingAny ? (
        <IconButton
          component="div"
          size="small"
          disabled
          onClick={() => onExtractField(basicFields)}
          role="button"
          tabIndex={0}
        >
          <CircularProgress size={16} />
        </IconButton>
      ) : (
        <Tooltip
          title={t("data.extractAllBasic", {
            ns: "labels",
            defaultValue: "Extract All Basic Fields",
          })}
        >
          <IconButton
            component="div"
            size="small"
            onClick={() => onExtractField(basicFields)}
            disabled={!hasImages}
            role="button"
            tabIndex={0}
          >
            <AutoAwesomeIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )
    ) : null
  return (
    <LabelDataAccordionSection
      section="basic"
      sectionKey="basic"
      expanded={accordionState}
      onChange={(_section, isExpanded) => onAccordionChange(isExpanded)}
      id="basic-information"
      scrollMarginTop="120px"
      action={extractButton}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", xl: "row" },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="product_name.en"
              label={t("data.fields.productNameEn")}
              control={control}
              type="text"
              helperText={t("data.helperText.productNameEn")}
              needsReview={getFieldMeta("product_name.en").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("product_name.en")}
              onExtract={() => onExtractField("product_name")}
              onToggleReview={() => onToggleReview("product_name.en")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="product_name.fr"
              label={t("data.fields.productNameFr")}
              control={control}
              type="text"
              helperText={t("data.helperText.productNameFr")}
              needsReview={getFieldMeta("product_name.fr").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("product_name.fr")}
              onExtract={() => onExtractField("product_name")}
              onToggleReview={() => onToggleReview("product_name.fr")}
              disabled={disabled}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", xl: "row" },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="brand_name.en"
              label={t("data.fields.brandNameEn")}
              control={control}
              type="text"
              helperText={t("data.helperText.brandNameEn")}
              needsReview={getFieldMeta("brand_name.en").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("brand_name.en")}
              onExtract={() => onExtractField("brand_name")}
              onToggleReview={() => onToggleReview("brand_name.en")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="brand_name.fr"
              label={t("data.fields.brandNameFr")}
              control={control}
              type="text"
              helperText={t("data.helperText.brandNameFr")}
              needsReview={getFieldMeta("brand_name.fr").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("brand_name.fr")}
              onExtract={() => onExtractField("brand_name")}
              onToggleReview={() => onToggleReview("brand_name.fr")}
              disabled={disabled}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", xl: "row" },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="registration_claim.en"
              label={t(
                "data.fields.registrationClaimEn",
                "Registration claim (EN)",
              )}
              control={control}
              type="text"
              helperText={t(
                "data.helperText.registrationClaim",
                "Verbatim registration claim text",
              )}
              needsReview={getFieldMeta("registration_claim.en").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("registration_claim.en")}
              onExtract={() => onExtractField("registration_claim")}
              onToggleReview={() => onToggleReview("registration_claim.en")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="registration_claim.fr"
              label={t(
                "data.fields.registrationClaimFr",
                "Registration claim (FR)",
              )}
              control={control}
              type="text"
              needsReview={getFieldMeta("registration_claim.fr").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("registration_claim.fr")}
              onExtract={() => onExtractField("registration_claim")}
              onToggleReview={() => onToggleReview("registration_claim.fr")}
              disabled={disabled}
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
            <LabelDataField
              fieldName="registration_number"
              label={t("data.fields.registrationNumber")}
              control={control}
              type="text"
              helperText={t("data.helperText.registrationNumber")}
              needsReview={getFieldMeta("registration_number").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("registration_number")}
              onExtract={() => onExtractField("registration_number")}
              onToggleReview={() => onToggleReview("registration_number")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="lot_number"
              label={t("data.fields.lotNumber")}
              control={control}
              type="text"
              helperText={t("data.helperText.lotNumber")}
              needsReview={getFieldMeta("lot_number").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("lot_number")}
              onExtract={() => onExtractField("lot_number")}
              onToggleReview={() => onToggleReview("lot_number")}
              disabled={disabled}
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
            <LabelDataField
              fieldName="net_weight"
              label={t("data.fields.netWeight")}
              control={control}
              type="text"
              helperText={t("data.helperText.netWeight")}
              needsReview={getFieldMeta("net_weight").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("net_weight")}
              onExtract={() => onExtractField("net_weight")}
              onToggleReview={() => onToggleReview("net_weight")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="volume"
              label={t("data.fields.volume")}
              control={control}
              type="text"
              helperText={t("data.helperText.volume")}
              needsReview={getFieldMeta("volume").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("volume")}
              onExtract={() => onExtractField("volume")}
              onToggleReview={() => onToggleReview("volume")}
              disabled={disabled}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", xl: "row" },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="exemption_claim.en"
              label={t("data.fields.exemptionClaimEn", "Exemption claim (EN)")}
              control={control}
              type="text"
              helperText={t(
                "data.helperText.exemptionClaim",
                "Verbatim exemption claim",
              )}
              needsReview={getFieldMeta("exemption_claim.en").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("exemption_claim.en")}
              onExtract={() => onExtractField("exemption_claim")}
              onToggleReview={() => onToggleReview("exemption_claim.en")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="exemption_claim.fr"
              label={t("data.fields.exemptionClaimFr", "Exemption claim (FR)")}
              control={control}
              type="text"
              needsReview={getFieldMeta("exemption_claim.fr").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("exemption_claim.fr")}
              onExtract={() => onExtractField("exemption_claim")}
              onToggleReview={() => onToggleReview("exemption_claim.fr")}
              disabled={disabled}
            />
          </Box>
        </Box>
        <LabelDataField
          fieldName="country_of_origin"
          label={t("data.fields.countryOfOrigin", "Country of origin")}
          control={control}
          type="text"
          helperText={t(
            "data.helperText.countryOfOrigin",
            "Country where manufactured or imported from",
          )}
          needsReview={getFieldMeta("country_of_origin").needs_review}
          hasImages={hasImages}
          isExtracting={getIsFieldExtracting("country_of_origin")}
          onExtract={() => onExtractField("country_of_origin")}
          onToggleReview={() => onToggleReview("country_of_origin")}
          disabled={disabled}
        />
        {isFertilizer && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>
                {t(
                  "data.fields.productClassification",
                  "Product classification",
                )}
              </InputLabel>
              <Controller
                name="product_classification"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t(
                      "data.fields.productClassification",
                      "Product classification",
                    )}
                    disabled={disabled}
                  >
                    <MenuItem value="">
                      <em>
                        {t("data.fields.productClassificationNone", "None")}
                      </em>
                    </MenuItem>
                    {PRODUCT_CLASSIFICATIONS.map((pc) => (
                      <MenuItem key={pc} value={pc}>
                        {t(`data.fields.productClassification.${pc}`, pc)}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <Box
              sx={{ display: "flex", alignItems: "center", pt: 1, gap: 0.5 }}
            >
              {hasImages && (
                <Tooltip title={t("data.extractField", { ns: "labels" })}>
                  <IconButton
                    size="small"
                    onClick={() => onExtractField("product_classification")}
                    disabled={
                      disabled || getIsFieldExtracting("product_classification")
                    }
                  >
                    {getIsFieldExtracting("product_classification") ? (
                      <CircularProgress size={16} />
                    ) : (
                      <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip
                title={
                  getFieldMeta("product_classification").needs_review
                    ? t("data.removeReviewFlag", { ns: "labels" })
                    : t("data.flagForReview", { ns: "labels" })
                }
              >
                <IconButton
                  size="small"
                  onClick={() => onToggleReview("product_classification")}
                  disabled={disabled}
                >
                  {getFieldMeta("product_classification").needs_review ? (
                    <FlagIcon color="warning" sx={{ fontSize: 18 }} />
                  ) : (
                    <FlagOutlinedIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        <LabelDataContacts
          fieldName="contacts"
          label={t("data.fields.contacts")}
          control={control}
          helperText={t("data.helperText.contacts")}
          needsReview={getFieldMeta("contacts").needs_review}
          hasImages={hasImages}
          isExtracting={getIsFieldExtracting("contacts")}
          onExtract={() => onExtractField("contacts")}
          onToggleReview={() => onToggleReview("contacts")}
          disabled={disabled}
        />
      </Box>
    </LabelDataAccordionSection>
  )
}
