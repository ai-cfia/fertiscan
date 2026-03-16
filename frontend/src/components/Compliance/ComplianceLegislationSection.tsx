import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import SaveIcon from "@mui/icons-material/Save"
import {
  Box,
  CircularProgress,
  IconButton,
  ListSubheader,
  Tooltip,
} from "@mui/material"
import type { Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
// ============================== Types ==============================
import type {
  ComplianceStatus,
  LegislationPublic,
  RequirementPublic,
} from "@/api"
import ComplianceRequirementAccordion from "./ComplianceRequirementAccordion"

interface ComplianceFormValues {
  compliance: Record<
    string,
    { status: ComplianceStatus | ""; description: string }
  >
}
interface ComplianceLegislationSectionProps {
  legislation: LegislationPublic
  requirements: RequirementPublic[]
  language: "en" | "fr"
  meetsPrerequisite: boolean
  complianceControl: Control<ComplianceFormValues>
  getIsRequirementDirty: (requirementId: string) => boolean
  getHasRequirementData: (requirementId: string) => boolean
  onSaveRequirement: (requirementId: string) => void
  onClearRequirement: (requirementId: string) => void
  isSavingCompliance: boolean
  isDeletingCompliance: boolean
  onEvaluate: (requirementId: string) => void
  onEvaluateLegislation: (requirementIds: string[]) => void
  onCancelRequirement?: (requirementId: string) => void
  isEvaluating: (requirementId: string) => boolean
  getEvaluationError: (requirementId: string) => string | null
}

// ============================== Component ==============================
export default function ComplianceLegislationSection({
  legislation,
  requirements,
  language,
  meetsPrerequisite,
  complianceControl,
  getIsRequirementDirty,
  getHasRequirementData,
  onSaveRequirement,
  onClearRequirement,
  isSavingCompliance,
  isDeletingCompliance,
  onEvaluate,
  onEvaluateLegislation,
  onCancelRequirement,
  isEvaluating,
  getEvaluationError,
}: ComplianceLegislationSectionProps) {
  const { t } = useTranslation("labels")
  const legislationTitle =
    language === "fr" && legislation.title_fr
      ? legislation.title_fr
      : (legislation.title_en ?? legislation.citation_reference)
  return (
    <Box>
      <ListSubheader
        component="div"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {legislationTitle}
        <Box
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Tooltip
            title={
              !meetsPrerequisite
                ? t("data.compliancePrerequisiteNotMet", {
                    defaultValue:
                      "Prerequisite not met: complete label data extraction first",
                  })
                : t("data.complianceRunLegislation")
            }
          >
            <span>
              <IconButton
                component="div"
                size="small"
                disabled={
                  !meetsPrerequisite ||
                  requirements.some((r) => isEvaluating(r.id))
                }
                onClick={() =>
                  onEvaluateLegislation(requirements.map((r) => r.id))
                }
                role="button"
                tabIndex={0}
              >
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t("data.save")}>
            <span>
              <IconButton
                component="div"
                size="small"
                disabled={
                  isSavingCompliance ||
                  !requirements.some((r) => getIsRequirementDirty(r.id))
                }
                onClick={() =>
                  requirements
                    .filter((r) => getIsRequirementDirty(r.id))
                    .forEach((r) => {
                      onSaveRequirement(r.id)
                    })
                }
                role="button"
                tabIndex={0}
              >
                {isSavingCompliance ? (
                  <CircularProgress size={18} />
                ) : (
                  <SaveIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </ListSubheader>
      {requirements.map((req) => (
        <ComplianceRequirementAccordion
          key={req.id}
          requirement={req}
          generalExemptions={legislation.general_exemptions ?? []}
          language={language}
          meetsPrerequisite={meetsPrerequisite}
          complianceControl={complianceControl}
          requirementId={req.id}
          isRequirementDirty={getIsRequirementDirty(req.id)}
          hasRequirementData={getHasRequirementData(req.id)}
          onSaveRequirement={onSaveRequirement}
          onClearRequirement={onClearRequirement}
          isSavingCompliance={isSavingCompliance}
          isDeletingCompliance={isDeletingCompliance}
          onEvaluate={onEvaluate}
          onCancelRequirement={onCancelRequirement}
          isEvaluating={isEvaluating(req.id)}
          evaluationError={getEvaluationError(req.id)}
        />
      ))}
    </Box>
  )
}
