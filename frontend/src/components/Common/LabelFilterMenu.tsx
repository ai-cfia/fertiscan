// ============================== Label list filters (menu) ==============================

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
import { useTranslation } from "react-i18next"
import type { ReviewStatus } from "#/api/types.gen"

type LabelFilterMenuProps = {
  reviewStatus?: ReviewStatus
  unlinked?: boolean
  onReviewStatusChange: (value?: ReviewStatus) => void
  onUnlinkedChange: (value?: boolean) => void
}

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
  reviewStatus,
  unlinked,
  onReviewStatusChange,
  onUnlinkedChange,
}: LabelFilterMenuProps) {
  const { t } = useTranslation("labels")
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [reviewStatusAnchorEl, setReviewStatusAnchorEl] =
    useState<null | HTMLElement>(null)
  const filterMenuOpen = Boolean(filterAnchorEl)
  const reviewStatusMenuOpen = Boolean(reviewStatusAnchorEl)
  const reviewStatusOptions: Array<{ value: ReviewStatus; label: string }> = [
    { value: "not_started", label: t("filter.notStarted") },
    { value: "in_progress", label: t("filter.inProgress") },
    { value: "completed", label: t("filter.completed") },
  ]
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null)
    setReviewStatusAnchorEl(null)
  }
  const handleReviewStatusChange = (value?: ReviewStatus) => {
    onReviewStatusChange(value)
    handleFilterMenuClose()
  }
  const handleUnlinkedChange = (value?: boolean) => {
    onUnlinkedChange(value)
    handleFilterMenuClose()
  }
  return (
    <>
      <Tooltip title={t("filter.title")}>
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
        <MenuItem onClick={(e) => setReviewStatusAnchorEl(e.currentTarget)}>
          <ListItemText>{t("filter.reviewStatus")}</ListItemText>
          <SubmenuArrow />
        </MenuItem>
        <Menu
          anchorEl={reviewStatusAnchorEl}
          open={reviewStatusMenuOpen}
          onClose={() => setReviewStatusAnchorEl(null)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          {reviewStatusOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={reviewStatus === option.value}
              onClick={() => handleReviewStatusChange(option.value)}
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
          <ListItemText>{t("filter.unlinked")}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
