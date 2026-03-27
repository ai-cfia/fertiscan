import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import { CircularProgress, IconButton, Tooltip } from "@mui/material"
import type { Control, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataAccordionSection from "#/components/Common/LabelDataAccordionSection"
import LabelDataGuaranteedAnalysis from "#/components/Common/LabelDataGuaranteedAnalysis"
import type { LabelDataFormValues } from "#/utils/labelDataHelpers"

// ============================== Guaranteed Analysis Section ==============================
interface GuaranteedAnalysisSectionProps {
  control: Control<LabelDataFormValues>
  form?: UseFormReturn<LabelDataFormValues>
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
export default function GuaranteedAnalysisSection({
  control,
  form,
  accordionState,
  onAccordionChange,
  getFieldMeta,
  hasImages,
  getIsFieldExtracting,
  onExtractField,
  onToggleReview,
  disabled = false,
  readOnly = false,
}: GuaranteedAnalysisSectionProps) {
  const { t } = useTranslation("labels")
  const guaranteedFields = ["guaranteed_analysis"]
  const isExtractingAny = guaranteedFields.some((field) =>
    getIsFieldExtracting(field),
  )
  const extractButton =
    hasImages && !disabled ? (
      isExtractingAny ? (
        <IconButton
          component="div"
          size="small"
          disabled
          onClick={() => onExtractField(guaranteedFields)}
          role="button"
          tabIndex={0}
        >
          <CircularProgress size={16} />
        </IconButton>
      ) : (
        <Tooltip
          title={t("data.extractAllGuaranteed", {
            ns: "labels",
            defaultValue: "Extract All Guaranteed Analysis",
          })}
        >
          <IconButton
            component="div"
            size="small"
            onClick={() => onExtractField(guaranteedFields)}
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
      section="guaranteed"
      sectionKey="guaranteed"
      expanded={accordionState}
      onChange={(_section, isExpanded) => onAccordionChange(isExpanded)}
      action={extractButton}
    >
      <LabelDataGuaranteedAnalysis
        fieldName="guaranteed_analysis"
        label={t("data.fields.guaranteedAnalysis")}
        control={control}
        form={form}
        helperText={
          readOnly ? undefined : t("data.helperText.guaranteedAnalysis")
        }
        needsReview={getFieldMeta("guaranteed_analysis").needs_review}
        hasImages={hasImages}
        isExtracting={getIsFieldExtracting("guaranteed_analysis")}
        onToggleReview={
          readOnly ? undefined : () => onToggleReview!("guaranteed_analysis")
        }
        disabled={disabled}
        readOnly={readOnly}
      />
    </LabelDataAccordionSection>
  )
}
