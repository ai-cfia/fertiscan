import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material"
import { useTranslation } from "react-i18next"
import type { AccordionSection } from "#/stores/useLabelData"

interface LabelDataAccordionSectionProps {
  section: AccordionSection
  sectionKey: string
  expanded: boolean
  onChange: (section: AccordionSection, expanded: boolean) => void
  children?: React.ReactNode
  id?: string
  scrollMarginTop?: string
  action?: React.ReactNode
}

export default function LabelDataAccordionSection({
  section,
  sectionKey,
  expanded,
  onChange,
  children,
  id,
  scrollMarginTop,
  action,
}: LabelDataAccordionSectionProps) {
  const { t } = useTranslation("labels")
  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, isExpanded) => onChange(section, isExpanded)}
      id={id}
      sx={scrollMarginTop ? { scrollMarginTop } : undefined}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            pr: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {(t as (key: string) => string)(`data.sections.${sectionKey}`)}
          </Typography>
          {action && (
            <Box
              onClick={(e) => {
                e.stopPropagation()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              {action}
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  )
}
