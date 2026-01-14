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
import { format } from "date-fns"
import { enCA } from "date-fns/locale"
import { useCallback, useEffect, useMemo, useState } from "react"
import { z } from "zod"
import {
  type ExtractionStatus,
  type LabelListItem,
  LabelsService,
  type VerificationStatus,
} from "@/api"
import {
  ExtractionStatusSchema,
  VerificationStatusSchema,
} from "@/api/schemas.gen"
import BulkActionsToolbar from "@/components/Common/BulkActionsToolbar"
import ExtractionStatusChip from "@/components/Common/ExtractionStatusChip"
import LabelFilterChips from "@/components/Common/LabelFilterChips"
import LabelFilterMenu from "@/components/Common/LabelFilterMenu"
import LabelListEmptyState from "@/components/Common/LabelListEmptyState"
import LabelRowActions from "@/components/Common/LabelRowActions"
import VerificationStatusChip from "@/components/Common/VerificationStatusChip"
import { useSnackbar } from "@/components/SnackbarProvider"
import { useLabelList } from "@/stores/useLabelList"
import { truncateUuid } from "@/utils"

const labelsSearchSchema = z.object({
  page: z.number().catch(0),
  extraction_status: z
    .enum(ExtractionStatusSchema.enum as unknown as [string, ...string[]])
    .optional(),
  verification_status: z
    .enum(VerificationStatusSchema.enum as unknown as [string, ...string[]])
    .optional(),
  unlinked: z.boolean().optional(),
  order_by: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
})

const PER_PAGE = 10

type LabelRow = {
  id: string
  productName: string | null
  verificationStatus: VerificationStatus | null
  extractionStatus: ExtractionStatus | null
  createdAt: string | null
}

function mapLabelToRow(label: LabelListItem): LabelRow {
  return {
    id: label.id,
    productName:
      label.product?.name_en ??
      label.product?.name_fr ??
      label.product?.registration_number ??
      null,
    verificationStatus: label.verification_status ?? null,
    extractionStatus: label.extraction_status ?? null,
    createdAt: label.created_at ?? null,
  }
}

type Order = "asc" | "desc"

function mapFrontendFieldToBackend(field: keyof LabelRow): string {
  const fieldMap: Record<keyof LabelRow, string> = {
    id: "id",
    createdAt: "created_at",
    productName: "product_name",
    extractionStatus: "extraction_status",
    verificationStatus: "verification_status",
  }
  return fieldMap[field] ?? "created_at"
}

interface HeadCell {
  disablePadding: boolean
  id: keyof LabelRow
  label: string
  numeric: boolean
}

const headCells: readonly HeadCell[] = [
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "ID",
  },
  {
    id: "productName",
    numeric: false,
    disablePadding: false,
    label: "Product Name",
  },
  {
    id: "extractionStatus",
    numeric: false,
    disablePadding: false,
    label: "Extraction Status",
  },
  {
    id: "verificationStatus",
    numeric: false,
    disablePadding: false,
    label: "Verification Status",
  },
  {
    id: "createdAt",
    numeric: false,
    disablePadding: false,
    label: "Created At",
  },
]

export const Route = createFileRoute("/_layout/$productType/labels/")({
  component: Labels,
  validateSearch: (search) => labelsSearchSchema.parse(search),
})

function LabelsTable() {
  const {
    page,
    extraction_status,
    verification_status,
    unlinked,
    order_by,
    order,
  } = Route.useSearch()
  const { productType } = Route.useParams()
  const [rowsPerPage, setRowsPerPage] = useState(PER_PAGE)
  const [selected, setSelected] = useState<readonly string[]>([])
  const navigate = Route.useNavigate()
  const orderBy = (order_by as keyof LabelRow) || "createdAt"
  const sortOrder = (order as Order) || "desc"
  const { setError } = useLabelList()
  const { showSuccessToast } = useSnackbar()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "labels",
      productType,
      page,
      rowsPerPage,
      extraction_status,
      verification_status,
      unlinked,
      order_by,
      order,
    ],
    queryFn: async () => {
      const response = await LabelsService.readLabels({
        query: {
          product_type: productType,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          extraction_status: extraction_status as ExtractionStatus | undefined,
          verification_status: verification_status as
            | VerificationStatus
            | undefined,
          unlinked: unlinked ?? undefined,
          order_by: mapFrontendFieldToBackend(orderBy),
          order: sortOrder,
        },
      })
      return response.data
    },
  })
  useEffect(() => {
    if (isError && error) {
      setError(error as Error)
    } else {
      setError(null)
    }
  }, [isError, error, setError])
  const labels: LabelRow[] = useMemo(() => {
    if (!data?.items) return []
    return data.items.map(mapLabelToRow)
  }, [data])
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
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
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
  const hasActiveFilters = Boolean(
    extraction_status || verification_status || unlinked,
  )
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
  const handleExtractionStatusChange = useCallback(
    (value?: ExtractionStatus) => {
      navigate({
        search: (prev) => {
          const newSearch = { ...prev, page: 0 }
          if (value === undefined) {
            delete newSearch.extraction_status
          } else {
            newSearch.extraction_status = value
          }
          return newSearch
        },
      })
    },
    [navigate],
  )
  const handleVerificationStatusChange = useCallback(
    (value?: VerificationStatus) => {
      navigate({
        search: (prev) => {
          const newSearch = { ...prev, page: 0 }
          if (value === undefined) {
            delete newSearch.verification_status
          } else {
            newSearch.verification_status = value
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
      showSuccessToast("Label ID copied to clipboard")
    },
    [showSuccessToast],
  )
  const handleBulkExport = useCallback(() => {
    // TODO: Implement export functionality
  }, [])
  const handleBulkDelete = useCallback(() => {
    setSelected([])
  }, [])
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
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={handleClearSelection}
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
            extractionStatus={
              extraction_status
                ? (extraction_status as ExtractionStatus)
                : undefined
            }
            verificationStatus={
              verification_status
                ? (verification_status as VerificationStatus)
                : undefined
            }
            unlinked={unlinked}
            onExtractionStatusChange={handleExtractionStatusChange}
            onVerificationStatusChange={handleVerificationStatusChange}
            onUnlinkedChange={handleUnlinkedChange}
          />
          <LabelFilterChips
            extractionStatus={
              extraction_status
                ? (extraction_status as ExtractionStatus)
                : undefined
            }
            verificationStatus={
              verification_status
                ? (verification_status as VerificationStatus)
                : undefined
            }
            unlinked={unlinked}
            onExtractionStatusRemove={() =>
              handleExtractionStatusChange(undefined)
            }
            onVerificationStatusRemove={() =>
              handleVerificationStatusChange(undefined)
            }
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
                      "aria-label": "select all labels",
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
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="right" padding="normal">
                <Box component="span" sx={visuallyHidden}>
                  Actions
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
                                cursor: "help",
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
                            aria-label={`Copy label ID ${label.id}`}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        formatCell(null)
                      )}
                    </TableCell>
                    <TableCell>{formatCell(label.productName)}</TableCell>
                    <TableCell>
                      <ExtractionStatusChip status={label.extractionStatus} />
                    </TableCell>
                    <TableCell>
                      <VerificationStatusChip
                        status={label.verificationStatus}
                      />
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
                        labelId={label.id}
                        onViewDetails={() => {
                          navigate({
                            to: "/$productType/labels/$labelId",
                            params: { productType, labelId: label.id },
                          })
                        }}
                        onDelete={() => {
                          // TODO: Implement delete functionality
                        }}
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
  useEffect(() => {
    document.title = "Labels - Label Inspection"
  }, [])
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        Labels
      </Typography>
      <LabelsTable />
    </Container>
  )
}
