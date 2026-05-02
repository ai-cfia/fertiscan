// ============================== Labels list ==============================

import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import {
  Box,
  Checkbox,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material"
import { visuallyHidden } from "@mui/utils"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { format } from "date-fns"
import { enCA } from "date-fns/locale"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { LabelListItem, ReviewStatus } from "#/api/types.gen"
import BulkActionsToolbar from "#/components/Common/BulkActionsToolbar"
import LabelFilterChips from "#/components/Common/LabelFilterChips"
import LabelFilterMenu from "#/components/Common/LabelFilterMenu"
import LabelListEmptyState from "#/components/Common/LabelListEmptyState"
import LabelRowActions from "#/components/Common/LabelRowActions"
import ReviewStatusChip from "#/components/Common/ReviewStatusChip"
import { useSnackbar } from "#/components/SnackbarProvider"
import { useDeleteLabels } from "#/hooks/useDeleteLabels"
import { readLabelsPageFn } from "#/server/labels-list"
import { clientRuntimeConfig } from "#/stores/useConfig"
import { useLabelList } from "#/stores/useLabelList"
import { useLanguage } from "#/stores/useLanguage"
import { truncateUuid } from "#/utils/truncate-uuid"

const REVIEW_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
] as const satisfies readonly ReviewStatus[]

type LabelsSearch = {
  page: number
  per_page: number
  review_status?: ReviewStatus
  unlinked?: boolean
  order_by?: string
  order?: "asc" | "desc"
}

function parseIntSearch(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v
  }
  if (typeof v === "string" && v.length > 0) {
    const n = Number.parseInt(v, 10)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

function validateLabelsSearch(search: Record<string, unknown>): LabelsSearch {
  const page = Math.max(0, parseIntSearch(search.page, 0))
  const per_page = Math.max(
    1,
    parseIntSearch(search.per_page, clientRuntimeConfig.defaultPerPage),
  )
  const rs = search.review_status
  const review_status =
    typeof rs === "string" &&
    (REVIEW_STATUSES as readonly string[]).includes(rs)
      ? (rs as ReviewStatus)
      : undefined
  const unlinked =
    search.unlinked === true || search.unlinked === "true" ? true : undefined
  const ob = search.order_by
  const order_by = typeof ob === "string" && ob.length > 0 ? ob : undefined
  const ord = search.order
  const order = ord === "asc" || ord === "desc" ? ord : undefined
  return {
    page,
    per_page,
    review_status,
    unlinked,
    order_by,
    order,
  }
}

type LabelRow = {
  id: string
  brand: string | null
  productName: string | null
  reviewStatus: ReviewStatus | null
  createdAt: string | null
}

function mapLabelToRow(label: LabelListItem, language: "en" | "fr"): LabelRow {
  const isFrench = language === "fr"
  return {
    id: label.id,
    brand: isFrench
      ? (label.label_data?.brand_name?.fr ??
        label.label_data?.brand_name?.en ??
        null)
      : (label.label_data?.brand_name?.en ??
        label.label_data?.brand_name?.fr ??
        null),
    productName: isFrench
      ? (label.label_data?.product_name?.fr ??
        label.label_data?.product_name?.en ??
        null)
      : (label.label_data?.product_name?.en ??
        label.label_data?.product_name?.fr ??
        null),
    reviewStatus: label.review_status ?? null,
    createdAt: label.created_at ?? null,
  }
}

type Order = "asc" | "desc"

function mapFrontendFieldToBackend(
  field: keyof LabelRow,
  language: "en" | "fr",
): string {
  const isFrench = language === "fr"
  const fieldMap: Record<keyof LabelRow, string> = {
    id: "id",
    brand: isFrench ? "brand_name_fr" : "brand_name_en",
    createdAt: "created_at",
    productName: isFrench ? "product_name_fr" : "product_name_en",
    reviewStatus: "review_status",
  }
  return fieldMap[field] ?? "created_at"
}

type HeadCell = {
  disablePadding: boolean
  id: keyof LabelRow
  label: string
  numeric: boolean
}

export const Route = createFileRoute("/_layout/$productType/labels/")({
  validateSearch: validateLabelsSearch,
  component: Labels,
})

function LabelsTable() {
  const { t } = useTranslation("labels")
  const { language } = useLanguage()
  const { page, per_page, review_status, unlinked, order_by, order } =
    Route.useSearch()
  const { productType } = Route.useParams()
  const rowsPerPage = per_page || clientRuntimeConfig.defaultPerPage
  const [selected, setSelected] = useState<readonly string[]>([])
  const navigate = Route.useNavigate()
  const orderBy = (order_by as keyof LabelRow) || "createdAt"
  const sortOrder = (order as Order) || "desc"
  const { setError } = useLabelList()
  const { showSuccessToast } = useSnackbar()
  const fetchLabelsPage = useServerFn(readLabelsPageFn)
  const { deleteOne, deleteMany, isDeletingId, isBulkDeleting } =
    useDeleteLabels()
  const headCells: readonly HeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: false,
      label: t("table.id"),
    },
    {
      id: "brand",
      numeric: false,
      disablePadding: false,
      label: t("table.brand"),
    },
    {
      id: "productName",
      numeric: false,
      disablePadding: false,
      label: t("table.productName"),
    },
    {
      id: "reviewStatus",
      numeric: false,
      disablePadding: false,
      label: t("table.reviewStatus"),
    },
    {
      id: "createdAt",
      numeric: false,
      disablePadding: false,
      label: t("table.createdAt"),
    },
  ]
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "labels",
      productType,
      page,
      per_page,
      review_status,
      unlinked,
      order_by,
      order,
      language,
    ],
    queryFn: () =>
      fetchLabelsPage({
        data: {
          productType,
          page,
          perPage: rowsPerPage,
          review_status,
          unlinked,
          order_by: mapFrontendFieldToBackend(orderBy, language),
          order: sortOrder,
        },
      }),
  })
  useEffect(() => {
    if (isError && error) {
      setError(error as Error)
    } else {
      setError(null)
    }
  }, [isError, error, setError])
  const labels: LabelRow[] = useMemo(() => {
    if (!data?.items) {
      return []
    }
    return data.items.map((label) => mapLabelToRow(label, language))
  }, [data, language])
  const setPage = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newRowsPerPage = Number.parseInt(event.target.value, 10)
    navigate({
      search: (prev) => ({
        ...prev,
        per_page: newRowsPerPage,
        page: 0,
      }),
    })
  }
  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof LabelRow,
  ) => {
    const isAsc = orderBy === property && sortOrder === "asc"
    const newOrder = isAsc ? "desc" : "asc"
    navigate({
      search: (prev) => ({
        ...prev,
        order_by: property,
        order: newOrder,
        page: 0,
      }),
    })
  }
  const visibleRows = labels
  const hasActiveFilters = Boolean(review_status || unlinked)
  const isEmpty = !data?.items || data.items.length === 0
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = visibleRows.map((label) => label.id)
      setSelected(newSelected)
      return
    }
    setSelected([])
  }
  const handleCheckboxClick = (
    event: React.MouseEvent<unknown>,
    id: string,
  ) => {
    event.stopPropagation()
    const selectedIndex = selected.indexOf(id)
    let newSelected: readonly string[] = []
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      )
    }
    setSelected(newSelected)
  }
  const handleRowClick = (event: React.MouseEvent<unknown>, id: string) => {
    const target = event.target as HTMLElement
    if (target.closest('input[type="checkbox"]') || target.closest("button")) {
      return
    }
    navigate({
      to: "/$productType/labels/$labelId",
      params: { productType, labelId: id },
    })
  }
  const isSelected = (id: string) => selected.indexOf(id) !== -1
  const handleReviewStatusChange = useCallback(
    (value?: ReviewStatus) => {
      navigate({
        search: (prev) => {
          const newSearch = { ...prev, page: 0 }
          if (value === undefined) {
            delete newSearch.review_status
          } else {
            newSearch.review_status = value
          }
          return newSearch
        },
      })
    },
    [navigate],
  )
  const handleUnlinkedChange = useCallback(
    (value?: boolean) => {
      navigate({
        search: (prev) => {
          const newSearch = { ...prev, page: 0 }
          if (value === undefined) {
            delete newSearch.unlinked
          } else {
            newSearch.unlinked = value
          }
          return newSearch
        },
      })
    },
    [navigate],
  )
  const formatCell = (value: string | null | undefined) => {
    if (!value) {
      return (
        <Box
          component="span"
          sx={{ color: "text.secondary", fontStyle: "italic" }}
        >
          —
        </Box>
      )
    }
    return value
  }
  const handleCopyId = useCallback(
    (event: React.MouseEvent, id: string) => {
      event.stopPropagation()
      navigator.clipboard.writeText(id)
      showSuccessToast(t("table.idCopied"))
    },
    [showSuccessToast, t],
  )
  const handleBulkExport = useCallback(() => {}, [])
  const handleBulkDelete = useCallback(async () => {
    const res = await deleteMany(selected)
    if (res.failed === 0) {
      setSelected([])
    }
  }, [deleteMany, selected])
  const handleClearSelection = useCallback(() => {
    setSelected([])
  }, [])
  useEffect(() => {
    setSelected([])
  }, [])
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      {selected.length > 0 ? (
        <BulkActionsToolbar
          selectedCount={selected.length}
          selectedText={t("labels.bulkActions.selected", {
            count: selected.length,
          })}
          deleteButtonText={t("labels.bulkActions.delete")}
          exportButtonText={t("labels.bulkActions.export")}
          deleteDialogTitle={t("labels.bulkActions.deleteDialog.title", {
            count: selected.length,
          })}
          deleteDialogDescription={t(
            "labels.bulkActions.deleteDialog.description",
            { count: selected.length },
          )}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={handleClearSelection}
          isDeleting={isBulkDeleting}
        />
      ) : (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <LabelFilterMenu
            reviewStatus={
              review_status ? (review_status as ReviewStatus) : undefined
            }
            unlinked={unlinked}
            onReviewStatusChange={handleReviewStatusChange}
            onUnlinkedChange={handleUnlinkedChange}
          />
          <LabelFilterChips
            reviewStatus={
              review_status ? (review_status as ReviewStatus) : undefined
            }
            unlinked={unlinked}
            onReviewStatusRemove={() => handleReviewStatusChange(undefined)}
            onUnlinkedRemove={() => handleUnlinkedChange(undefined)}
          />
        </Toolbar>
      )}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={
                    selected.length > 0 && selected.length < visibleRows.length
                  }
                  checked={
                    visibleRows.length > 0 &&
                    selected.length === visibleRows.length
                  }
                  onChange={handleSelectAllClick}
                  slotProps={{
                    input: {
                      "aria-label": t("table.selectAll"),
                    },
                  }}
                />
              </TableCell>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? "right" : "left"}
                  padding={headCell.disablePadding ? "none" : "normal"}
                  sortDirection={orderBy === headCell.id ? sortOrder : false}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? sortOrder : "asc"}
                    onClick={(event) => handleRequestSort(event, headCell.id)}
                    sx={
                      headCell.numeric
                        ? {
                            flexDirection: "row-reverse",
                            "& .MuiTableSortLabel-icon": {
                              marginLeft: 0,
                              marginRight: "4px",
                            },
                          }
                        : undefined
                    }
                  >
                    {headCell.label}
                    {orderBy === headCell.id ? (
                      <Box component="span" sx={visuallyHidden}>
                        {sortOrder === "desc"
                          ? t("table.sortedDescending")
                          : t("table.sortedAscending")}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="right" padding="normal">
                <Box component="span" sx={visuallyHidden}>
                  {t("table.actions")}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isEmpty ? (
              <LabelListEmptyState
                hasActiveFilters={hasActiveFilters}
                colSpan={headCells.length + 2}
              />
            ) : (
              visibleRows.map((label) => {
                const isItemSelected = isSelected(label.id)
                return (
                  <TableRow
                    hover
                    onClick={(event) => handleRowClick(event, label.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={label.id}
                    selected={isItemSelected}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onClick={(event) =>
                          handleCheckboxClick(event, label.id)
                        }
                        slotProps={{
                          input: {
                            "aria-labelledby": `label-checkbox-${label.id}`,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        "& .copy-button": {
                          opacity: 0,
                          transition: "opacity 0.2s ease-in-out",
                        },
                        "&:hover .copy-button": {
                          opacity: 1,
                        },
                      }}
                    >
                      {label.id ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Tooltip title={label.id} placement="top">
                            <Box
                              component="span"
                              sx={{
                                fontFamily: "monospace",
                                fontSize: "0.875rem",
                              }}
                            >
                              {truncateUuid(label.id)}
                            </Box>
                          </Tooltip>
                          <IconButton
                            className="copy-button"
                            size="small"
                            onClick={(e) => handleCopyId(e, label.id)}
                            sx={{
                              padding: 0.125,
                              minWidth: 20,
                              width: 20,
                              height: 20,
                              "&:hover": { backgroundColor: "action.hover" },
                              "& .MuiSvgIcon-root": {
                                fontSize: "0.875rem",
                              },
                            }}
                            aria-label={t("table.copyId", { id: label.id })}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        formatCell(null)
                      )}
                    </TableCell>
                    <TableCell>{formatCell(label.brand)}</TableCell>
                    <TableCell>{formatCell(label.productName)}</TableCell>
                    <TableCell>
                      <ReviewStatusChip status={label.reviewStatus} />
                    </TableCell>
                    <TableCell>
                      {label.createdAt
                        ? format(
                            new Date(label.createdAt),
                            "MMM d, yyyy h:mm a",
                            {
                              locale: enCA,
                            },
                          )
                        : formatCell(null)}
                    </TableCell>
                    <TableCell
                      align="right"
                      padding="normal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LabelRowActions
                        reviewStatus={label.reviewStatus}
                        onViewDetails={() => {
                          navigate({
                            to: "/$productType/labels/$labelId",
                            params: { productType, labelId: label.id },
                          })
                        }}
                        onReview={() => {
                          navigate({
                            to: "/$productType/labels/$labelId/edit",
                            params: { productType, labelId: label.id },
                          })
                        }}
                        onDelete={() => deleteOne(label.id)}
                        isDeleting={isDeletingId === label.id}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={data?.total ?? 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  )
}

function Labels() {
  const { t } = useTranslation("labels")
  useEffect(() => {
    document.title = t("pageTitle")
  }, [t])
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        {t("title")}
      </Typography>
      <LabelsTable />
    </Container>
  )
}
