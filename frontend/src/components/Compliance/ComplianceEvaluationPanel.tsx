import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import EditIcon from "@mui/icons-material/Edit"
import SaveIcon from "@mui/icons-material/Save"
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material"
import { Link } from "@tanstack/react-router"
import type { Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
// ============================== Types ==============================
import type {
  ComplianceStatus,
  LegislationPublic,
  RequirementPublic,
} from "@/api"
import ComplianceLegislationSection from "./ComplianceLegislationSection"

interface ComplianceFormValues {
  compliance: Record<
    string,
    { status: ComplianceStatus | ""; description: string }
  >
}
interface ComplianceEvaluationPanelProps {
  productType: string
  labelId: string
  meetsPrerequisite: boolean
  requirementsByLegislation: Array<{
    legislation: LegislationPublic
    requirements: RequirementPublic[]
  }>
  language: "en" | "fr"
  complianceControl: Control<ComplianceFormValues>
  getIsRequirementDirty: (requirementId: string) => boolean
  getHasRequirementData: (requirementId: string) => boolean
  onSaveRequirement: (requirementId: string) => void
  onClearRequirement: (requirementId: string) => void
  isSavingCompliance: boolean
  isDeletingCompliance: boolean
  onEvaluate: (requirementId: string) => void
  onEvaluateAll: () => void
  onEvaluateLegislation: (requirementIds: string[]) => void
  onCancelRequirement?: (requirementId: string) => void
  isEvaluating: (requirementId: string) => boolean
  isEvaluatingAny: boolean
  getEvaluationError: (requirementId: string) => string | null
}

// ============================== Component ==============================
export default function ComplianceEvaluationPanel({
  productType,
  labelId,
  meetsPrerequisite,
  requirementsByLegislation,
  language,
  complianceControl,
  getIsRequirementDirty,
  getHasRequirementData,
  onSaveRequirement,
  onClearRequirement,
  isSavingCompliance,
  isDeletingCompliance,
  onEvaluate,
  onEvaluateAll,
  onEvaluateLegislation,
  onCancelRequirement,
  isEvaluating,
  isEvaluatingAny,
  getEvaluationError,
}: ComplianceEvaluationPanelProps) {
  const { t } = useTranslation("labels")
  const allRequirements = requirementsByLegislation.flatMap(
    (g) => g.requirements,
  )
  const hasDirtyRequirements = allRequirements.some((r) =>
    getIsRequirementDirty(r.id),
  )
  const handleSaveAll = () => {
    allRequirements
      .filter((r) => getIsRequirementDirty(r.id))
      .forEach((r) => {
        onSaveRequirement(r.id)
      })
  }
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
      <Toolbar
        sx={{
          minHeight: "48px !important",
          px: 1,
          borderBottom: 1,
          borderColor: "divider",
          gap: 0.5,
          justifyContent: "flex-end",
        }}
      >
        <Tooltip
          title={
            !meetsPrerequisite
              ? t("data.compliancePrerequisiteNotMet", {
                  defaultValue:
                    "Prerequisite not met: complete label data extraction first",
                })
              : requirementsByLegislation.length === 0
                ? t("data.complianceEvaluationPlaceholder", {
                    defaultValue:
                      "Requirement list and evaluation will appear here.",
                  })
                : ""
          }
        >
          <span>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={
                !meetsPrerequisite ||
                requirementsByLegislation.length === 0 ||
                isEvaluatingAny
              }
              onClick={onEvaluateAll}
              startIcon={<AutoAwesomeIcon />}
              sx={{ mr: 0.5 }}
            >
              {t("data.complianceRunAll")}
            </Button>
          </span>
        </Tooltip>
        <Tooltip
          title={
            !hasDirtyRequirements && requirementsByLegislation.length > 0
              ? t("data.complianceNoUnsavedChanges", {
                  defaultValue: "No unsaved changes",
                })
              : ""
          }
        >
          <span>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={
                !meetsPrerequisite ||
                requirementsByLegislation.length === 0 ||
                isSavingCompliance ||
                !hasDirtyRequirements
              }
              onClick={handleSaveAll}
              startIcon={
                isSavingCompliance ? (
                  <CircularProgress size={16} />
                ) : (
                  <SaveIcon />
                )
              }
              sx={{ mr: 0.5 }}
            >
              {t("data.save")}
            </Button>
          </span>
        </Tooltip>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          component={Link}
          to={`/${productType}/labels/${labelId}/edit`}
          startIcon={<EditIcon />}
        >
          {t("data.title")}
        </Button>
      </Toolbar>
      <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 2, pt: 0 }}>
        {requirementsByLegislation.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("data.complianceEvaluationPlaceholder", {
              defaultValue: "Requirement list and evaluation will appear here.",
            })}
          </Typography>
        ) : (
          <Box>
            {requirementsByLegislation.map(
              ({ legislation, requirements: reqs }) => (
                <ComplianceLegislationSection
                  key={legislation.id}
                  legislation={legislation}
                  requirements={reqs}
                  language={language}
                  meetsPrerequisite={meetsPrerequisite}
                  complianceControl={complianceControl}
                  getIsRequirementDirty={getIsRequirementDirty}
                  getHasRequirementData={getHasRequirementData}
                  onSaveRequirement={onSaveRequirement}
                  onClearRequirement={onClearRequirement}
                  isSavingCompliance={isSavingCompliance}
                  isDeletingCompliance={isDeletingCompliance}
                  onEvaluate={onEvaluate}
                  onEvaluateLegislation={onEvaluateLegislation}
                  onCancelRequirement={onCancelRequirement}
                  isEvaluating={isEvaluating}
                  getEvaluationError={getEvaluationError}
                />
              ),
            )}
          </Box>
        )}
      </Box>
    </Paper>
  )
}
