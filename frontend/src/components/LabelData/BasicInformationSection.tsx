import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material"
import type { Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataAccordionSection from "@/components/Common/LabelDataAccordionSection"
import LabelDataContacts from "@/components/Common/LabelDataContacts"
import LabelDataField from "@/components/Common/LabelDataField"

// ============================== Basic Information Section ==============================
interface BasicInformationSectionProps {
  control: Control<any>
  accordionState: boolean
  onAccordionChange: (isExpanded: boolean) => void
  getFieldMeta: (fieldName: string) => {
    needs_review: boolean
  }
  hasImages: boolean
  getIsFieldExtracting: (fieldName: string) => boolean
  onExtractField: (fieldName: string | string[] | null) => void
  onToggleReview: (fieldName: string) => void
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
  disabled = false,
}: BasicInformationSectionProps) {
  const { t } = useTranslation("labels")
  const basicFields = [
    "product_name_en",
    "product_name_fr",
    "brand_name_en",
    "brand_name_fr",
    "registration_number",
    "lot_number",
    "net_weight",
    "volume",
    "contacts",
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
              fieldName="product_name_en"
              label={t("data.fields.productNameEn")}
              control={control}
              type="text"
              helperText={t("data.helperText.productNameEn")}
              needsReview={getFieldMeta("product_name_en").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("product_name_en")}
              onExtract={() => onExtractField("product_name_en")}
              onToggleReview={() => onToggleReview("product_name_en")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="product_name_fr"
              label={t("data.fields.productNameFr")}
              control={control}
              type="text"
              helperText={t("data.helperText.productNameFr")}
              needsReview={getFieldMeta("product_name_fr").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("product_name_fr")}
              onExtract={() => onExtractField("product_name_fr")}
              onToggleReview={() => onToggleReview("product_name_fr")}
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
              fieldName="brand_name_en"
              label={t("data.fields.brandNameEn")}
              control={control}
              type="text"
              helperText={t("data.helperText.brandNameEn")}
              needsReview={getFieldMeta("brand_name_en").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("brand_name_en")}
              onExtract={() => onExtractField("brand_name_en")}
              onToggleReview={() => onToggleReview("brand_name_en")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="brand_name_fr"
              label={t("data.fields.brandNameFr")}
              control={control}
              type="text"
              helperText={t("data.helperText.brandNameFr")}
              needsReview={getFieldMeta("brand_name_fr").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("brand_name_fr")}
              onExtract={() => onExtractField("brand_name_fr")}
              onToggleReview={() => onToggleReview("brand_name_fr")}
              disabled={disabled}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: "column",
          }}
        >
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
        </Box>
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
