// ============================== Products list ==============================

import AddIcon from "@mui/icons-material/Add"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import InventoryIcon from "@mui/icons-material/Inventory"
import {
  Box,
  Button,
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
import type { ProductPublic } from "#/api/types.gen"
import BulkActionsToolbar from "#/components/Common/BulkActionsToolbar"
import EmptyState from "#/components/Common/EmptyState"
import ProductRowActions from "#/components/Common/ProductRowActions"
import { useSnackbar } from "#/components/SnackbarProvider"
import { useDeleteProducts } from "#/hooks/useDeleteProducts"
import { readProductsPageFn } from "#/server/products-list"
import { clientRuntimeConfig } from "#/stores/useConfig"
import { useLanguage } from "#/stores/useLanguage"
import { useProductList } from "#/stores/useProductList"
import { truncateUuid } from "#/utils/truncate-uuid"

type ProductsSearch = {
  page: number
  per_page: number
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

function validateProductsSearch(
  search: Record<string, unknown>,
): ProductsSearch {
  const page = Math.max(0, parseIntSearch(search.page, 0))
  const per_page = Math.max(
    1,
    parseIntSearch(search.per_page, clientRuntimeConfig.defaultPerPage),
  )
  const ob = search.order_by
  const order_by = typeof ob === "string" && ob.length > 0 ? ob : undefined
  const ord = search.order
  const order = ord === "asc" || ord === "desc" ? ord : undefined
  return { page, per_page, order_by, order }
}

type ProductRow = {
  id: string
  brand: string | null
  name: string | null
  registrationNumber: string | null
  createdAt: string
}

function mapProductToRow(
  product: ProductPublic,
  language: "en" | "fr",
): ProductRow {
  const isFrench = language === "fr"
  return {
    id: product.id,
    brand: isFrench
      ? (product.brand_name_fr ?? product.brand_name_en ?? null)
      : (product.brand_name_en ?? product.brand_name_fr ?? null),
    name: isFrench
      ? (product.name_fr ?? product.name_en ?? null)
      : (product.name_en ?? product.name_fr ?? null),
    registrationNumber: product.registration_number ?? null,
    createdAt: product.created_at,
  }
}

type Order = "asc" | "desc"

function mapFrontendFieldToBackend(
  field: keyof ProductRow,
  language: "en" | "fr",
): string {
  const isFrench = language === "fr"
  const fieldMap: Record<keyof ProductRow, string> = {
    id: "id",
    brand: isFrench ? "brand_name_fr" : "brand_name_en",
    name: isFrench ? "name_fr" : "name_en",
    registrationNumber: "registration_number",
    createdAt: "created_at",
  }
  return fieldMap[field] ?? "created_at"
}

type HeadCell = {
  disablePadding: boolean
  id: keyof ProductRow
  label: string
  numeric: boolean
}

export const Route = createFileRoute("/_layout/$productType/products/")({
  validateSearch: validateProductsSearch,
  component: Products,
})

function ProductsTable() {
  const { t } = useTranslation(["products", "common"])
  const { language } = useLanguage()
  const { page, per_page, order_by, order } = Route.useSearch()
  const { productType } = Route.useParams()
  const rowsPerPage = per_page || clientRuntimeConfig.defaultPerPage
  const [selected, setSelected] = useState<readonly string[]>([])
  const navigate = Route.useNavigate()
  const orderBy = (order_by as keyof ProductRow) || "createdAt"
  const sortOrder = (order as Order) || "desc"
  const { setError } = useProductList()
  const { showSuccessToast } = useSnackbar()
  const fetchProductsPage = useServerFn(readProductsPageFn)
  const { deleteOne, deleteMany, isDeletingId, isBulkDeleting } =
    useDeleteProducts()
  const headCells: readonly HeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: false,
      label: t("products:table.id"),
    },
    {
      id: "brand",
      numeric: false,
      disablePadding: false,
      label: t("products:table.brand"),
    },
    {
      id: "name",
      numeric: false,
      disablePadding: false,
      label: t("products:table.name"),
    },
    {
      id: "registrationNumber",
      numeric: false,
      disablePadding: false,
      label: t("products:table.registrationNumber"),
    },
    {
      id: "createdAt",
      numeric: false,
      disablePadding: false,
      label: t("products:table.createdAt"),
    },
  ]
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "products",
      productType,
      page,
      per_page,
      order_by,
      order,
      language,
    ],
    queryFn: async () =>
      fetchProductsPage({
        data: {
          productType,
          page,
          perPage: rowsPerPage,
          order_by: mapFrontendFieldToBackend(orderBy, language),
          order: sortOrder,
        },
      }),
  })
  useEffect(() => {
    if (isError && error) {
      setError(error instanceof Error ? error : new Error(String(error)))
    } else {
      setError(null)
    }
  }, [isError, error, setError])
  const products: ProductRow[] = useMemo(() => {
    if (!data?.items) {
      return []
    }
    return data.items.map((product) => mapProductToRow(product, language))
  }, [data, language])
  const handleChangePage = (_event: unknown, newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
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
    property: keyof ProductRow,
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
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = products.map((product) => product.id)
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
      to: "/$productType/products/$productId",
      params: { productType, productId: id },
    })
  }
  const isSelected = (id: string) => selected.indexOf(id) !== -1
  const handleCopyId = useCallback(
    (event: React.MouseEvent, id: string) => {
      event.stopPropagation()
      void navigator.clipboard.writeText(id)
      showSuccessToast(t("products:table.idCopied"))
    },
    [showSuccessToast, t],
  )
  const handleBulkDelete = useCallback(async () => {
    const res = await deleteMany(selected)
    if (res.failed === 0) {
      setSelected([])
    }
  }, [deleteMany, selected])
  const handleClearSelection = useCallback(() => {
    setSelected([])
  }, [])
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
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  const isEmpty = !data?.items || data.items.length === 0
  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      {selected.length > 0 ? (
        <BulkActionsToolbar
          selectedCount={selected.length}
          selectedText={t("products.bulkActions.selected", {
            count: selected.length,
          })}
          deleteButtonText={t("products.bulkActions.delete")}
          exportButtonText={t("products.bulkActions.export")}
          deleteDialogTitle={t("products.bulkActions.deleteDialog.title", {
            count: selected.length,
          })}
          deleteDialogDescription={t(
            "products.bulkActions.deleteDialog.description",
            { count: selected.length },
          )}
          onDelete={handleBulkDelete}
          onExport={() => {}}
          onClearSelection={handleClearSelection}
          isDeleting={isBulkDeleting}
        />
      ) : null}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={
                    selected.length > 0 && selected.length < products.length
                  }
                  checked={
                    products.length > 0 && selected.length === products.length
                  }
                  onChange={handleSelectAllClick}
                  slotProps={{
                    input: {
                      "aria-label": t("products:table.selectAll"),
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
                  >
                    {headCell.label}
                    {orderBy === headCell.id ? (
                      <Box component="span" sx={visuallyHidden}>
                        {sortOrder === "desc"
                          ? t("products:table.sortedDescending")
                          : t("products:table.sortedAscending")}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {isEmpty ? (
              <EmptyState
                icon={InventoryIcon}
                title={t("products:empty.noProducts")}
                description={t("products:empty.noProductsDescription")}
                colSpan={headCells.length + 2}
              />
            ) : (
              products.map((product) => {
                const isItemSelected = isSelected(product.id)
                return (
                  <TableRow
                    hover
                    onClick={(event) => handleRowClick(event, product.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={product.id}
                    selected={isItemSelected}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onClick={(event) =>
                          handleCheckboxClick(event, product.id)
                        }
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
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Tooltip title={product.id} placement="top">
                          <Box
                            component="span"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                            }}
                          >
                            {truncateUuid(product.id)}
                          </Box>
                        </Tooltip>
                        <IconButton
                          className="copy-button"
                          size="small"
                          onClick={(e) => handleCopyId(e, product.id)}
                          sx={{
                            padding: 0.125,
                            minWidth: 20,
                            width: 20,
                            height: 20,
                          }}
                          aria-label={t("products:table.copyId", {
                            id: product.id,
                            defaultValue: "Copy product ID {{id}}",
                          })}
                        >
                          <ContentCopyIcon fontSize="inherit" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>{formatCell(product.brand)}</TableCell>
                    <TableCell>{formatCell(product.name)}</TableCell>
                    <TableCell>
                      {formatCell(product.registrationNumber)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(product.createdAt), "MMM d, yyyy", {
                        locale: enCA,
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <ProductRowActions
                        onViewDetails={() => {
                          navigate({
                            to: "/$productType/products/$productId",
                            params: { productType, productId: product.id },
                          })
                        }}
                        onDelete={() => deleteOne(product.id)}
                        isDeleting={isDeletingId === product.id}
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

function Products() {
  const { t } = useTranslation(["products", "common"])
  const { productType } = Route.useParams()
  const navigate = Route.useNavigate()
  useEffect(() => {
    document.title = t("products:pageTitle")
  }, [t])
  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          py: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4">{t("products:title")}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            navigate({
              to: "/$productType/products/new",
              params: { productType },
            })
          }}
        >
          {t("common:products.createNew")}
        </Button>
      </Box>
      <ProductsTable />
    </Container>
  )
}
