import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material"
import type { Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataAccordionSection from "@/components/Common/LabelDataAccordionSection"
import LabelDataField from "@/components/Common/LabelDataField"

// ============================== Safety Information Section ==============================
interface SafetyInformationSectionProps {
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
  isFertilizer: boolean
  disabled?: boolean
}
export default function SafetyInformationSection({
  control,
  accordionState,
  onAccordionChange,
  getFieldMeta,
  hasImages,
  getIsFieldExtracting,
  onExtractField,
  onToggleReview,
  isFertilizer,
  disabled = false,
}: SafetyInformationSectionProps) {
  const { t } = useTranslation("labels")
  const safetyFields = [
    "caution_en",
    "caution_fr",
    "instructions_en",
    "instructions_fr",
  ]
  const isExtractingAny = safetyFields.some((field) =>
    getIsFieldExtracting(field),
  )
  const extractButton =
    isFertilizer && hasImages && !disabled ? (
      isExtractingAny ? (
        <IconButton
          size="small"
          disabled
          onClick={() => onExtractField(safetyFields)}
        >
          <CircularProgress size={16} />
        </IconButton>
      ) : (
        <Tooltip
          title={t("data.extractAllSafety", {
            ns: "labels",
            defaultValue: "Extract All Safety Fields",
          })}
        >
          <IconButton
            size="small"
            onClick={() => onExtractField(safetyFields)}
            disabled={!hasImages}
          >
            <AutoAwesomeIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )
    ) : null
  return (
    <LabelDataAccordionSection
      section="safety"
      sectionKey="safety"
      expanded={accordionState}
      onChange={(_section, isExpanded) => onAccordionChange(isExpanded)}
      action={extractButton}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {isFertilizer && (
          <>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", "2xl": "row" },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <LabelDataField
                  fieldName="caution_en"
                  label={t("data.fields.cautionEn")}
                  control={control}
                  helperText={t("data.helperText.cautionEn")}
                  needsReview={getFieldMeta("caution_en").needs_review}
                  onToggleReview={() => onToggleReview("caution_en")}
                  multiline
                  maxRows={5}
                  disabled={disabled}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <LabelDataField
                  fieldName="caution_fr"
                  label={t("data.fields.cautionFr")}
                  control={control}
                  helperText={t("data.helperText.cautionFr")}
                  needsReview={getFieldMeta("caution_fr").needs_review}
                  onToggleReview={() => onToggleReview("caution_fr")}
                  multiline
                  maxRows={5}
                  disabled={disabled}
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", "2xl": "row" },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <LabelDataField
                  fieldName="instructions_en"
                  label={t("data.fields.instructionsEn")}
                  control={control}
                  helperText={t("data.helperText.instructionsEn")}
                  needsReview={getFieldMeta("instructions_en").needs_review}
                  onToggleReview={() => onToggleReview("instructions_en")}
                  multiline
                  maxRows={5}
                  disabled={disabled}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <LabelDataField
                  fieldName="instructions_fr"
                  label={t("data.fields.instructionsFr")}
                  control={control}
                  helperText={t("data.helperText.instructionsFr")}
                  needsReview={getFieldMeta("instructions_fr").needs_review}
                  onToggleReview={() => onToggleReview("instructions_fr")}
                  multiline
                  maxRows={5}
                  disabled={disabled}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </LabelDataAccordionSection>
  )
}
