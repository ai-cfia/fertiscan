import FilterListIcon from "@mui/icons-material/FilterList"
import {
  Box,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material"
import { useState } from "react"
import type { ExtractionStatus, VerificationStatus } from "@/api"

interface LabelFilterMenuProps {
  extractionStatus?: ExtractionStatus
  verificationStatus?: VerificationStatus
  unlinked?: boolean
  onExtractionStatusChange: (value?: ExtractionStatus) => void
  onVerificationStatusChange: (value?: VerificationStatus) => void
  onUnlinkedChange: (value?: boolean) => void
}

const EXTRACTION_STATUS_OPTIONS: Array<{
  value: ExtractionStatus
  label: string
}> = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
]

const VERIFICATION_STATUS_OPTIONS: Array<{
  value: VerificationStatus
  label: string
}> = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
]

const SubmenuArrow = () => (
  <Box
    component="span"
    sx={{
      width: 0,
      height: 0,
      borderLeft: "4px solid",
      borderTop: "3px solid transparent",
      borderBottom: "3px solid transparent",
      borderLeftColor: "text.secondary",
      ml: 1,
    }}
  />
)

export default function LabelFilterMenu({
  extractionStatus,
  verificationStatus,
  unlinked,
  onExtractionStatusChange,
  onVerificationStatusChange,
  onUnlinkedChange,
}: LabelFilterMenuProps) {
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [extractionStatusAnchorEl, setExtractionStatusAnchorEl] =
    useState<null | HTMLElement>(null)
  const [verificationStatusAnchorEl, setVerificationStatusAnchorEl] =
    useState<null | HTMLElement>(null)
  const filterMenuOpen = Boolean(filterAnchorEl)
  const extractionStatusMenuOpen = Boolean(extractionStatusAnchorEl)
  const verificationStatusMenuOpen = Boolean(verificationStatusAnchorEl)
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null)
    setExtractionStatusAnchorEl(null)
    setVerificationStatusAnchorEl(null)
  }
  const handleExtractionStatusChange = (value?: ExtractionStatus) => {
    onExtractionStatusChange(value)
    handleFilterMenuClose()
  }
  const handleVerificationStatusChange = (value?: VerificationStatus) => {
    onVerificationStatusChange(value)
    handleFilterMenuClose()
  }
  const handleUnlinkedChange = (value?: boolean) => {
    onUnlinkedChange(value)
    handleFilterMenuClose()
  }
  return (
    <>
      <Tooltip title="Filter list">
        <IconButton onClick={handleFilterMenuOpen}>
          <FilterListIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={filterAnchorEl}
        open={filterMenuOpen}
        onClose={handleFilterMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={(e) => setExtractionStatusAnchorEl(e.currentTarget)}>
          <ListItemText>Extraction Status</ListItemText>
          <SubmenuArrow />
        </MenuItem>
        <Menu
          anchorEl={extractionStatusAnchorEl}
          open={extractionStatusMenuOpen}
          onClose={() => setExtractionStatusAnchorEl(null)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          {EXTRACTION_STATUS_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              selected={extractionStatus === option.value}
              onClick={() => handleExtractionStatusChange(option.value)}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
        <MenuItem
          onClick={(e) => setVerificationStatusAnchorEl(e.currentTarget)}
        >
          <ListItemText>Verification Status</ListItemText>
          <SubmenuArrow />
        </MenuItem>
        <Menu
          anchorEl={verificationStatusAnchorEl}
          open={verificationStatusMenuOpen}
          onClose={() => setVerificationStatusAnchorEl(null)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          {VERIFICATION_STATUS_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              selected={verificationStatus === option.value}
              onClick={() => handleVerificationStatusChange(option.value)}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
        <MenuItem
          selected={unlinked === true}
          onClick={() =>
            handleUnlinkedChange(unlinked === true ? undefined : true)
          }
        >
          <ListItemText>Unlinked</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
