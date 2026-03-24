import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import {
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material"
import type { Control, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataAccordionSection from "@/components/Common/LabelDataAccordionSection"
import LabelDataBilingualStatementList from "@/components/Common/LabelDataBilingualStatementList"
import type { LabelDataFormValues } from "@/utils/labelDataHelpers"

const STATEMENT_FIELDS = [
  "precaution_statements",
  "directions_for_use_statements",
  "customer_formula_statements",
  "intended_use_statements",
  "processing_instruction_statements",
  "experimental_statements",
  "export_statements",
] as const

// ============================== Statements and Claims Section ==============================
interface StatementsAndClaimsSectionProps {
  control: Control<LabelDataFormValues>
  form?: UseFormReturn<LabelDataFormValues>
  accordionState: boolean
  onAccordionChange: (isExpanded: boolean) => void
  getFieldMeta: (formPath: string) => { needs_review: boolean }
  hasImages: boolean
  getIsFieldExtracting: (formPath: string) => boolean
  onExtractField: (fieldName: string | string[] | null) => void
  onToggleReview?: (formPath: string) => void
  disabled?: boolean
  readOnly?: boolean
}
export default function StatementsAndClaimsSection({
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
}: StatementsAndClaimsSectionProps) {
  const { t } = useTranslation("labels")
  const isExtractingAny = STATEMENT_FIELDS.some((field) =>
    getIsFieldExtracting(field),
  )
  const extractButton =
    hasImages && !disabled ? (
      isExtractingAny ? (
        <IconButton
          component="div"
          size="small"
          disabled
          onClick={() =>
            onExtractField(STATEMENT_FIELDS as unknown as string[])
          }
          role="button"
          tabIndex={0}
        >
          <CircularProgress size={16} />
        </IconButton>
      ) : (
        <Tooltip
          title={t("data.extractAllStatements", {
            ns: "labels",
            defaultValue: "Extract All Statements",
          })}
        >
          <IconButton
            component="div"
            size="small"
            onClick={() =>
              onExtractField(STATEMENT_FIELDS as unknown as string[])
            }
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
      section="statements"
      sectionKey="statements"
      expanded={accordionState}
      onChange={(_section, isExpanded) => onAccordionChange(isExpanded)}
      action={extractButton}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {STATEMENT_FIELDS.map((fieldName) => (
          <Box key={fieldName}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              {t(`data.statements.${fieldName}`, fieldName.replace(/_/g, " "))}
            </Typography>
            <LabelDataBilingualStatementList
              fieldName={fieldName}
              label=""
              control={control}
              form={form}
              needsReview={getFieldMeta(fieldName).needs_review}
              hasImages={hasImages}
              isExtracting={getIsFieldExtracting(fieldName)}
              onExtract={() => onExtractField(fieldName)}
              onToggleReview={
                readOnly ? undefined : () => onToggleReview!(fieldName)
              }
              disabled={disabled}
              readOnly={readOnly}
              emptyStateMessage={t(
                `data.statements.empty.${fieldName}`,
                "No items",
              )}
              addButtonLabel={t("data.statements.add", "Add")}
              enLabel={t("data.statements.en", "English")}
              frLabel={t("data.statements.fr", "French")}
            />
          </Box>
        ))}
      </Box>
    </LabelDataAccordionSection>
  )
}
