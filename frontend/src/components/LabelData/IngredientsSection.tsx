import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import { CircularProgress, IconButton, Tooltip } from "@mui/material"
import type { Control, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataAccordionSection from "@/components/Common/LabelDataAccordionSection"
import LabelDataIngredients from "@/components/Common/LabelDataIngredients"
import type { LabelDataFormValues } from "@/utils/labelDataHelpers"

// ============================== Ingredients Section ==============================
interface IngredientsSectionProps {
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
export default function IngredientsSection({
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
}: IngredientsSectionProps) {
  const { t } = useTranslation("labels")
  const ingredientsFields = ["ingredients"]
  const isExtractingAny = ingredientsFields.some((field) =>
    getIsFieldExtracting(field),
  )
  const extractButton =
    hasImages && !disabled ? (
      isExtractingAny ? (
        <IconButton
          component="div"
          size="small"
          disabled
          onClick={() => onExtractField(ingredientsFields)}
          role="button"
          tabIndex={0}
        >
          <CircularProgress size={16} />
        </IconButton>
      ) : (
        <Tooltip
          title={t("data.extractAllIngredients", {
            ns: "labels",
            defaultValue: "Extract All Ingredients",
          })}
        >
          <IconButton
            component="div"
            size="small"
            onClick={() => onExtractField(ingredientsFields)}
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
      section="ingredients"
      sectionKey="ingredients"
      expanded={accordionState}
      onChange={(_section, isExpanded) => onAccordionChange(isExpanded)}
      action={extractButton}
    >
      <LabelDataIngredients
        fieldName="ingredients"
        label={t("data.fields.ingredients")}
        control={control}
        form={form}
        helperText={readOnly ? undefined : t("data.helperText.ingredients")}
        needsReview={getFieldMeta("ingredients").needs_review}
        hasImages={hasImages}
        isExtracting={getIsFieldExtracting("ingredients")}
        onToggleReview={
          readOnly ? undefined : () => onToggleReview!("ingredients")
        }
        disabled={disabled}
        readOnly={readOnly}
      />
    </LabelDataAccordionSection>
  )
}
