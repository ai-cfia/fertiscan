// ============================== Compliance requirement accordion ==============================

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import BlockIcon from "@mui/icons-material/Block"
import CheckIcon from "@mui/icons-material/Check"
import CloseIcon from "@mui/icons-material/Close"
import DeleteIcon from "@mui/icons-material/Delete"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"
import SaveIcon from "@mui/icons-material/Save"
import StopIcon from "@mui/icons-material/Stop"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import type { ReactElement } from "react"
import { useState } from "react"
import type { Control } from "react-hook-form"
import { Controller, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type {
  ComplianceStatus,
  ProvisionSnippet,
  RequirementPublic,
} from "#/api/types.gen"

interface ComplianceFormValues {
  compliance: Record<
    string,
    { status: ComplianceStatus | ""; description: string }
  >
}
interface ComplianceRequirementAccordionProps {
  requirement: RequirementPublic
  generalExemptions?: ProvisionSnippet[]
  language: "en" | "fr"
  meetsPrerequisite: boolean
  complianceControl: Control<ComplianceFormValues>
  requirementId: string
  isRequirementDirty: boolean
  hasRequirementData: boolean
  onSaveRequirement: (requirementId: string) => void
  onClearRequirement: (requirementId: string) => void
  isSavingCompliance: boolean
  isDeletingCompliance: boolean
  onEvaluate: (requirementId: string) => void
  onCancelRequirement?: (requirementId: string) => void
  isEvaluating: boolean
  evaluationError?: string | null
}

const STATUS_LABEL: Record<ComplianceStatus, string> = {
  compliant: "data.complianceStatusCompliant",
  non_compliant: "data.complianceStatusNonCompliant",
  not_applicable: "data.complianceStatusNotApplicable",
  inconclusive: "data.complianceStatusInconclusive",
}
const STATUS_ICON: Record<ComplianceStatus, ReactElement> = {
  compliant: <CheckIcon color="success" sx={{ fontSize: 18 }} />,
  non_compliant: <CloseIcon color="error" sx={{ fontSize: 18 }} />,
  not_applicable: <BlockIcon color="info" sx={{ fontSize: 18 }} />,
  inconclusive: <HelpOutlineIcon color="warning" sx={{ fontSize: 18 }} />,
}

const STATUS_OPTIONS: ComplianceStatus[] = [
  "compliant",
  "non_compliant",
  "not_applicable",
  "inconclusive",
]
export default function ComplianceRequirementAccordion({
  requirement: req,
  generalExemptions = [],
  language,
  meetsPrerequisite,
  complianceControl,
  requirementId,
  isRequirementDirty,
  hasRequirementData,
  onSaveRequirement,
  onClearRequirement,
  isSavingCompliance,
  isDeletingCompliance,
  onEvaluate,
  onCancelRequirement,
  isEvaluating,
  evaluationError,
}: ComplianceRequirementAccordionProps) {
  const { t } = useTranslation("labels")
  const { t: tCommon } = useTranslation("common")
  const [isHovered, setIsHovered] = useState(false)
  const status = useWatch({
    control: complianceControl,
    name: `compliance.${requirementId}.status`,
    defaultValue: "",
  })
  const displayStatus =
    status && STATUS_LABEL[status as ComplianceStatus] ? status : null
  const title =
    language === "fr" && req.title_fr ? req.title_fr : (req.title_en ?? req.id)
  const citation = req.provisions?.[0]?.citation
  const summaryTitle = citation ? `${citation} – ${title}` : title
  return (
    <Accordion
      disableGutters
      sx={{
        "&:before": { display: "none" },
        boxShadow: "none",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            pr: 2,
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 0 }}>
            {summaryTitle}
          </Typography>
          <Box
            onClick={(e) => {
              e.stopPropagation()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            {displayStatus && (
              <Tooltip
                title={String(
                  t(STATUS_LABEL[displayStatus as ComplianceStatus] as never),
                )}
              >
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    "& .MuiSvgIcon-root": { fontSize: 16 },
                  }}
                >
                  {STATUS_ICON[displayStatus as ComplianceStatus]}
                </Box>
              </Tooltip>
            )}
            <Tooltip
              title={
                !meetsPrerequisite
                  ? t("data.compliancePrerequisiteNotMet", {
                      defaultValue:
                        "Prerequisite not met: complete label data extraction first",
                    })
                  : isEvaluating && isHovered && onCancelRequirement
                    ? tCommon("button.cancel")
                    : t("data.complianceRunRequirement")
              }
            >
              <span>
                <IconButton
                  component="div"
                  size="small"
                  disabled={!meetsPrerequisite}
                  onClick={() =>
                    isEvaluating && onCancelRequirement
                      ? onCancelRequirement(req.id)
                      : onEvaluate(req.id)
                  }
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  role="button"
                  tabIndex={0}
                >
                  {isEvaluating && isHovered && onCancelRequirement ? (
                    <StopIcon sx={{ fontSize: 18 }} />
                  ) : isEvaluating ? (
                    <CircularProgress size={18} />
                  ) : (
                    <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t("data.save")}>
              <span>
                <IconButton
                  component="div"
                  size="small"
                  disabled={!isRequirementDirty || isSavingCompliance}
                  onClick={() => onSaveRequirement(req.id)}
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
            <Tooltip
              title={hasRequirementData ? t("data.complianceClear") : ""}
            >
              <span>
                <IconButton
                  component="div"
                  size="small"
                  disabled={
                    !hasRequirementData || isDeletingCompliance || isEvaluating
                  }
                  onClick={() => onClearRequirement(req.id)}
                  role="button"
                  tabIndex={0}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {evaluationError ? (
          <Typography variant="body2" color="error">
            {evaluationError}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Controller
              name={`compliance.${requirementId}.status`}
              control={complianceControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t("data.complianceStatusLabel")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || "")}
                  size="small"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  <MenuItem value="">
                    <em>{t("data.complianceStatusPlaceholder")}</em>
                  </MenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          "& .MuiSvgIcon-root": { fontSize: 18 },
                        }}
                      >
                        {STATUS_ICON[s]}
                        {String(t(STATUS_LABEL[s] as never))}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name={`compliance.${requirementId}.description`}
              control={complianceControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("data.complianceExplanationLabel")}
                  placeholder={t("data.complianceExplanationPlaceholder")}
                  slotProps={{ inputLabel: { shrink: true } }}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                />
              )}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={!meetsPrerequisite || isEvaluating}
                onClick={() => onEvaluate(req.id)}
                startIcon={
                  isEvaluating ? (
                    <CircularProgress size={16} />
                  ) : (
                    <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                  )
                }
              >
                {t("data.complianceRunRequirement")}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={!isRequirementDirty || isSavingCompliance}
                onClick={() => onSaveRequirement(req.id)}
                startIcon={
                  isSavingCompliance ? (
                    <CircularProgress size={16} />
                  ) : (
                    <SaveIcon />
                  )
                }
              >
                {t("data.save")}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={
                  !hasRequirementData || isDeletingCompliance || isEvaluating
                }
                onClick={() => onClearRequirement(req.id)}
                startIcon={<DeleteIcon />}
              >
                {t("data.complianceClear")}
              </Button>
            </Box>
          </Box>
        )}
        {req.provisions?.[0] &&
          (() => {
            const rule = req.provisions[0]
            const text =
              language === "fr" && rule.text_fr
                ? rule.text_fr
                : (rule.text_en ?? rule.text_fr)
            const combined = text ? `${rule.citation} – ${text}` : rule.citation
            return (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  {t("data.complianceRequirement")}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {combined}
                </Typography>
              </Box>
            )
          })()}
        {generalExemptions.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {t("data.complianceGlobalExemptions")}
            </Typography>
            <List dense disablePadding sx={{ listStyleType: "disc", pl: 2 }}>
              {generalExemptions.map((p, i) => {
                const text =
                  language === "fr" && p.text_fr
                    ? p.text_fr
                    : (p.text_en ?? p.text_fr)
                const combined = text ? `${p.citation} – ${text}` : p.citation
                return (
                  <ListItem
                    key={i}
                    disablePadding
                    sx={{ display: "list-item", mt: 0.5 }}
                  >
                    <Typography variant="body2">{combined}</Typography>
                  </ListItem>
                )
              })}
            </List>
          </Box>
        )}
        {(() => {
          const exemptions =
            req.modifiers?.filter((m) => m.type === "EXEMPTION") ?? []
          const applicability =
            req.modifiers?.filter(
              (m) => m.type === "APPLICABILITY_CONDITION",
            ) ?? []
          return (
            <>
              {exemptions.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {t("data.complianceExemptions")}
                  </Typography>
                  <List
                    dense
                    disablePadding
                    sx={{ listStyleType: "disc", pl: 2 }}
                  >
                    {exemptions.map((mod, i) => {
                      const p = mod.provision
                      const text =
                        language === "fr" && p.text_fr
                          ? p.text_fr
                          : (p.text_en ?? p.text_fr)
                      const combined = text
                        ? `${p.citation} – ${text}`
                        : p.citation
                      return (
                        <ListItem
                          key={i}
                          disablePadding
                          sx={{ display: "list-item", mt: 0.5 }}
                        >
                          <Typography variant="body2">{combined}</Typography>
                        </ListItem>
                      )
                    })}
                  </List>
                </Box>
              )}
              {applicability.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {t("data.complianceApplicabilityCondition")}
                  </Typography>
                  <List
                    dense
                    disablePadding
                    sx={{ listStyleType: "disc", pl: 2 }}
                  >
                    {applicability.map((mod, i) => {
                      const p = mod.provision
                      const text =
                        language === "fr" && p.text_fr
                          ? p.text_fr
                          : (p.text_en ?? p.text_fr)
                      const combined = text
                        ? `${p.citation} – ${text}`
                        : p.citation
                      return (
                        <ListItem
                          key={i}
                          disablePadding
                          sx={{ display: "list-item", mt: 0.5 }}
                        >
                          <Typography variant="body2">{combined}</Typography>
                        </ListItem>
                      )
                    })}
                  </List>
                </Box>
              )}
            </>
          )
        })()}
      </AccordionDetails>
    </Accordion>
  )
}
