import EditIcon from "@mui/icons-material/Edit"
import { Box, Button, Paper, Typography } from "@mui/material"
import { Link } from "@tanstack/react-router"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import BasicInformationSection from "@/components/LabelData/BasicInformationSection"
import GuaranteedAnalysisSection from "@/components/LabelData/GuaranteedAnalysisSection"
import IngredientsSection from "@/components/LabelData/IngredientsSection"
import NPKAnalysisSection from "@/components/LabelData/NPKAnalysisSection"
import ProductAssociationSection from "@/components/LabelData/ProductAssociationSection"
import StatementsAndClaimsSection from "@/components/LabelData/StatementsAndClaimsSection"
import type { AccordionSection, AccordionState } from "@/stores/useLabelData"

// ============================== Types ==============================
interface ComplianceLabelDataPanelProps {
  label: { product_id?: string | null }
  labelId: string
  productType: string
  meetsPrerequisite: boolean
  form: UseFormReturn<any>
  accordionState: AccordionState
  onAccordionChange: (section: AccordionSection, isExpanded: boolean) => void
  isFertilizer: boolean
}

// ============================== Component ==============================
export default function ComplianceLabelDataPanel({
  label,
  labelId,
  productType,
  meetsPrerequisite,
  form,
  accordionState,
  onAccordionChange,
  isFertilizer,
}: ComplianceLabelDataPanelProps) {
  const { t } = useTranslation("labels")
  const control = form.control
  const noop = () => {}
  const getFieldMetaStub = (_: string) => ({ needs_review: false })
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: { xs: "auto", md: "100%" },
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
      }}
    >
      {!meetsPrerequisite ? (
        <Box sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            {t("data.compliancePrerequisiteNotMet", {
              defaultValue:
                "Prerequisite not met: complete label data extraction first",
            })}
          </Typography>
          <Button
            component={Link}
            to={`/${productType}/labels/${labelId}/edit`}
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            sx={{ mt: 2 }}
          >
            {t("data.title")}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
          }}
        >
          <form>
            <ProductAssociationSection
              label={label}
              registrationNumber={form.watch("registration_number")}
              brandNameEn={form.watch("brand_name")?.en}
              brandNameFr={form.watch("brand_name")?.fr}
              productNameEn={form.watch("product_name")?.en}
              productNameFr={form.watch("product_name")?.fr}
              accordionState={accordionState.association}
              onAccordionChange={(isExpanded) =>
                onAccordionChange("association", isExpanded)
              }
              onAssociate={noop}
              onCreateAndAssociate={noop}
              disabled
            />
            <BasicInformationSection
              control={control}
              accordionState={accordionState.basic}
              onAccordionChange={(isExpanded) =>
                onAccordionChange("basic", isExpanded)
              }
              getFieldMeta={getFieldMetaStub}
              hasImages={false}
              getIsFieldExtracting={() => false}
              onExtractField={noop}
              isFertilizer={isFertilizer}
              disabled
              readOnly
            />
            {isFertilizer && (
              <NPKAnalysisSection
                control={control}
                accordionState={accordionState.npk}
                onAccordionChange={(isExpanded) =>
                  onAccordionChange("npk", isExpanded)
                }
                getFieldMeta={getFieldMetaStub}
                hasImages={false}
                getIsFieldExtracting={() => false}
                onExtractField={noop}
                disabled
                readOnly
              />
            )}
            {isFertilizer && (
              <IngredientsSection
                control={control}
                form={form}
                accordionState={accordionState.ingredients}
                onAccordionChange={(isExpanded) =>
                  onAccordionChange("ingredients", isExpanded)
                }
                getFieldMeta={getFieldMetaStub}
                hasImages={false}
                getIsFieldExtracting={() => false}
                onExtractField={noop}
                disabled
                readOnly
              />
            )}
            {isFertilizer && (
              <GuaranteedAnalysisSection
                control={control}
                form={form}
                accordionState={accordionState.guaranteed}
                onAccordionChange={(isExpanded) =>
                  onAccordionChange("guaranteed", isExpanded)
                }
                getFieldMeta={getFieldMetaStub}
                hasImages={false}
                getIsFieldExtracting={() => false}
                onExtractField={noop}
                disabled
                readOnly
              />
            )}
            {isFertilizer && (
              <StatementsAndClaimsSection
                control={control}
                form={form}
                accordionState={accordionState.statements}
                onAccordionChange={(isExpanded) =>
                  onAccordionChange("statements", isExpanded)
                }
                getFieldMeta={getFieldMetaStub}
                hasImages={false}
                getIsFieldExtracting={() => false}
                onExtractField={noop}
                disabled
                readOnly
              />
            )}
          </form>
        </Box>
      )}
    </Paper>
  )
}
