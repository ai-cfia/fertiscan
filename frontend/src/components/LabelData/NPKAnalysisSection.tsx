import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material"
import type { Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataAccordionSection from "#/components/Common/LabelDataAccordionSection"
import LabelDataField from "#/components/Common/LabelDataField"
import type { LabelDataFormValues } from "#/utils/labelDataHelpers"

// ============================== NPK Analysis Section ==============================
interface NPKAnalysisSectionProps {
  control: Control<LabelDataFormValues>
  accordionState: boolean
  onAccordionChange: (isExpanded: boolean) => void
  getFieldMeta: (fieldName: string) => {
    needs_review: boolean
  }
  hasImages: boolean
  getIsFieldExtracting: (fieldName: string) => boolean
  onExtractField: (fieldName: string | string[] | null) => void
  onToggleReview?: (fieldName: string) => void
  disabled?: boolean
  readOnly?: boolean
}
export default function NPKAnalysisSection({
  control,
  accordionState,
  onAccordionChange,
  getFieldMeta,
  hasImages,
  getIsFieldExtracting,
  onExtractField,
  onToggleReview,
  disabled = false,
  readOnly = false,
}: NPKAnalysisSectionProps) {
  const { t } = useTranslation("labels")
  const npkFields = ["n", "p", "k"]
  const isExtractingAny = npkFields.some((field) => getIsFieldExtracting(field))
  const extractButton =
    hasImages && !disabled ? (
      isExtractingAny ? (
        <IconButton
          component="div"
          size="small"
          disabled
          onClick={() => onExtractField(npkFields)}
          role="button"
          tabIndex={0}
        >
          <CircularProgress size={16} />
        </IconButton>
      ) : (
        <Tooltip
          title={t("data.extractAllNPK", {
            ns: "labels",
            defaultValue: "Extract All NPK Fields",
          })}
        >
          <IconButton
            component="div"
            size="small"
            onClick={() => onExtractField(npkFields)}
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
      section="npk"
      sectionKey="npk"
      expanded={accordionState}
      onChange={(_section, isExpanded) => onAccordionChange(isExpanded)}
      action={extractButton}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", lg: "row" },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="n"
              label={t("data.fields.n")}
              control={control}
              type="number"
              helperText={readOnly ? undefined : t("data.helperText.n")}
              needsReview={getFieldMeta("n").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("n")}
              onToggleReview={readOnly ? undefined : () => onToggleReview!("n")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="p"
              label={t("data.fields.p")}
              control={control}
              type="number"
              helperText={readOnly ? undefined : t("data.helperText.p")}
              needsReview={getFieldMeta("p").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("p")}
              onToggleReview={readOnly ? undefined : () => onToggleReview!("p")}
              disabled={disabled}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LabelDataField
              fieldName="k"
              label={t("data.fields.k")}
              control={control}
              type="number"
              helperText={readOnly ? undefined : t("data.helperText.k")}
              needsReview={getFieldMeta("k").needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting("k")}
              onToggleReview={readOnly ? undefined : () => onToggleReview!("k")}
              disabled={disabled}
            />
          </Box>
        </Box>
      </Box>
    </LabelDataAccordionSection>
  )
}
