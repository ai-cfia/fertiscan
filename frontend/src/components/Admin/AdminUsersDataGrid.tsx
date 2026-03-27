// ============================== Admin users DataGrid ==============================

import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import DeleteIcon from "@mui/icons-material/Delete"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Tooltip,
} from "@mui/material"
import {
  ColumnsPanelTrigger,
  DataGrid,
  FilterPanelTrigger,
  type GridColDef,
  type GridFilterModel,
  type GridRowSelectionModel,
  type GridToolbarProps,
  getGridSingleSelectOperators,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  Toolbar,
  ToolbarButton,
  useGridApiContext,
  useGridRootProps,
} from "@mui/x-data-grid"
import { frFR } from "@mui/x-data-grid/locales"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { UserPublic } from "#/api"
import UserRowActions from "#/components/Common/UserRowActions"
import { useSnackbar } from "#/components/SnackbarProvider"
import { useCurrentUser } from "#/hooks/use-current-user"
import { deleteUsersByIdsAdminFn, readUsersListFn } from "#/server/admin-users"
import { useConfig } from "#/stores/useConfig"
import { useLanguage } from "#/stores/useLanguage"
import { truncateUuid } from "#/utils/truncate-uuid"

const STATUS_ROLE_FILTER_OPERATORS = getGridSingleSelectOperators().filter(
  (op) => op.value === "is",
)

function mapDataGridSortToBackend(field: string): string {
  const fieldMap: Record<string, string> = {
    id: "id",
    fullName: "first_name",
    email: "email",
    role: "is_superuser",
    status: "is_active",
    is_superuser: "is_superuser",
    is_active: "is_active",
  }
  return fieldMap[field] ?? "created_at"
}

type CustomToolbarProps = GridToolbarProps & {
  onAddUser?: () => void
  onDeleteSelected?: () => void
  rowSelectionModel?: GridRowSelectionModel
}

function CustomDataGridToolbar(props: CustomToolbarProps) {
  const { t } = useTranslation("common")
  const apiRef = useGridApiContext()
  const rootProps = useGridRootProps()
  const {
    showQuickFilter = true,
    quickFilterProps,
    onAddUser,
    onDeleteSelected,
    rowSelectionModel,
  } = props
  const hasSelection =
    !!rowSelectionModel &&
    ("type" in rowSelectionModel && rowSelectionModel.type === "exclude"
      ? true
      : "ids" in rowSelectionModel && rowSelectionModel.ids.size > 0)
  const ColumnSelectorIcon = rootProps.slots.columnSelectorIcon
  const OpenFilterIcon = rootProps.slots.openFilterButtonIcon
  const QuickFilterIcon = rootProps.slots.quickFilterIcon
  const QuickFilterClearIcon = rootProps.slots.quickFilterClearIcon
  const BaseIconButton = rootProps.slots.baseIconButton
  return (
    <Toolbar>
      <Box sx={{ flex: 1 }} />
      {onAddUser ? (
        <Tooltip title={t("admin.addUser")}>
          <ToolbarButton onClick={onAddUser} color="default">
            <PersonAddIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
      ) : null}
      <Tooltip title={t("admin.deleteSelected")}>
        <span>
          <IconButton
            size="small"
            color={hasSelection ? "error" : "default"}
            disabled={!hasSelection}
            onClick={onDeleteSelected}
            aria-label={t("admin.deleteSelected")}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      {(!rootProps.disableColumnSelector || !rootProps.disableColumnFilter) && (
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      )}
      {!rootProps.disableColumnSelector && (
        <Tooltip title={apiRef.current.getLocaleText("toolbarColumns")}>
          <ColumnsPanelTrigger render={<ToolbarButton />}>
            <ColumnSelectorIcon fontSize="small" />
          </ColumnsPanelTrigger>
        </Tooltip>
      )}
      {!rootProps.disableColumnFilter && (
        <Tooltip title={apiRef.current.getLocaleText("toolbarFilters")}>
          <FilterPanelTrigger
            render={(triggerProps, state) => (
              <ToolbarButton
                {...triggerProps}
                color={state.filterCount > 0 ? "primary" : "default"}
              >
                <Badge
                  badgeContent={state.filterCount}
                  color="primary"
                  variant="dot"
                >
                  <OpenFilterIcon fontSize="small" />
                </Badge>
              </ToolbarButton>
            )}
          />
        </Tooltip>
      )}
      {showQuickFilter ? (
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      ) : null}
      {showQuickFilter ? (
        <QuickFilter
          parser={quickFilterProps?.quickFilterParser}
          formatter={quickFilterProps?.quickFilterFormatter}
          debounceMs={quickFilterProps?.debounceMs}
          className={quickFilterProps?.className}
          render={(quickFilterRootProps, state) => {
            const expanded = state.expanded
            const BaseTextField = rootProps.slots.baseTextField
            return (
              <Box
                {...quickFilterRootProps}
                sx={{
                  display: "grid",
                  alignItems: "center",
                }}
              >
                <QuickFilterTrigger
                  render={(triggerProps) => (
                    <Tooltip
                      title={apiRef.current.getLocaleText(
                        "toolbarQuickFilterLabel",
                      )}
                      enterDelay={0}
                    >
                      <Box
                        component="span"
                        sx={{
                          gridArea: "1 / 1",
                          width: "min-content",
                          height: "min-content",
                          zIndex: 1,
                          opacity: expanded ? 0 : 1,
                          pointerEvents: expanded ? "none" : "auto",
                          transition: "opacity 0.2s ease-in-out",
                        }}
                      >
                        <ToolbarButton
                          {...triggerProps}
                          color="default"
                          aria-disabled={expanded}
                        >
                          <QuickFilterIcon fontSize="small" />
                        </ToolbarButton>
                      </Box>
                    </Tooltip>
                  )}
                />
                <QuickFilterControl
                  render={(controlProps) => {
                    const {
                      ref,
                      slotProps: controlSlotProps,
                      ...rest
                    } = controlProps
                    return (
                      <Box
                        sx={{
                          gridArea: "1 / 1",
                          overflowX: "clip",
                          width: expanded ? 260 : 40,
                          opacity: expanded ? 1 : 0,
                          transition:
                            "width 0.2s ease-in-out, opacity 0.2s ease-in-out",
                        }}
                      >
                        <BaseTextField
                          {...rest}
                          inputRef={ref}
                          aria-label={apiRef.current.getLocaleText(
                            "toolbarQuickFilterLabel",
                          )}
                          placeholder={apiRef.current.getLocaleText(
                            "toolbarQuickFilterPlaceholder",
                          )}
                          size="small"
                          fullWidth
                          slotProps={{
                            ...controlSlotProps,
                            input: {
                              startAdornment: (
                                <QuickFilterIcon fontSize="small" />
                              ),
                              endAdornment: controlProps.value ? (
                                <QuickFilterClear
                                  render={(clearProps) => (
                                    <BaseIconButton
                                      {...clearProps}
                                      size="small"
                                      edge="end"
                                      aria-label={apiRef.current.getLocaleText(
                                        "toolbarQuickFilterDeleteIconLabel",
                                      )}
                                    >
                                      <QuickFilterClearIcon fontSize="small" />
                                    </BaseIconButton>
                                  )}
                                />
                              ) : null,
                              ...controlSlotProps?.input,
                            },
                          }}
                        />
                      </Box>
                    )
                  }}
                />
              </Box>
            )
          }}
        />
      ) : null}
    </Toolbar>
  )
}

function mapFilterModelToBackendParams(filterModel: GridFilterModel): {
  is_active: boolean | null | undefined
  is_superuser: boolean | null | undefined
} {
  const result = { is_active: undefined, is_superuser: undefined } as {
    is_active: boolean | null | undefined
    is_superuser: boolean | null | undefined
  }
  for (const item of filterModel.items ?? []) {
    if (item.field === "is_active" && item.operator === "is") {
      const val = item.value as boolean | undefined
      if (typeof val === "boolean") {
        result.is_active = val
      }
    }
    if (item.field === "is_superuser" && item.operator === "is") {
      const val = item.value as boolean | undefined
      if (typeof val === "boolean") {
        result.is_superuser = val
      }
    }
  }
  return result
}

export default function AdminUsersDataGrid({
  onAddUser,
}: {
  onAddUser?: () => void
}) {
  const { t } = useTranslation("common")
  const { language } = useLanguage()
  const { defaultPerPage } = useConfig()
  const { showSuccessToast, showErrorToast } = useSnackbar()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const runReadUsers = useServerFn(readUsersListFn)
  const runDeleteMany = useServerFn(deleteUsersByIdsAdminFn)
  const localeText =
    language === "fr"
      ? frFR.components.MuiDataGrid.defaultProps.localeText
      : undefined
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: defaultPerPage,
  })
  const [sortModel, setSortModel] = useState<
    { field: string; sort: "asc" | "desc" }[]
  >([{ field: "email", sort: "asc" }])
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  })
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({ type: "include", ids: new Set() })
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }))
  }, [])
  const orderBy = sortModel[0]?.field ?? "email"
  const sortOrder = sortModel[0]?.sort ?? "asc"
  const search = filterModel.quickFilterValues?.join(" ").trim() || undefined
  const filterParams = mapFilterModelToBackendParams(filterModel)
  const { data, isLoading } = useQuery({
    queryKey: [
      "users",
      "datagrid",
      {
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        order_by: mapDataGridSortToBackend(orderBy),
        order: sortOrder,
        search,
        is_active: filterParams.is_active,
        is_superuser: filterParams.is_superuser,
      },
    ],
    queryFn: () =>
      runReadUsers({
        data: {
          offset: paginationModel.page * paginationModel.pageSize,
          limit: paginationModel.pageSize,
          order_by: mapDataGridSortToBackend(orderBy),
          order: sortOrder,
          search,
          is_active: filterParams.is_active,
          is_superuser: filterParams.is_superuser,
        },
      }),
  })
  const selectedIdsForDelete =
    rowSelectionModel.type === "include"
      ? [...rowSelectionModel.ids]
          .map(String)
          .filter((id) => id !== currentUser?.id)
      : []
  const bulkDeleteMutation = useMutation({
    mutationFn: (userIds: string[]) => runDeleteMany({ data: { userIds } }),
    onSuccess: () => {
      showSuccessToast(t("admin.rowActions.deleteSuccess"))
      setBulkDialogOpen(false)
      setRowSelectionModel({ type: "include", ids: new Set() })
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
    onError: (error: unknown) => {
      const detail = error instanceof Error ? error.message : ""
      showErrorToast(detail || t("admin.rowActions.deleteError"))
    },
  })
  const users = data?.items ?? []
  const rowCount = data?.total ?? 0
  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: t("admin.table.id"),
      width: 120,
      filterable: false,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            "& .copy-button": {
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
            },
            "&:hover .copy-button": { opacity: 1 },
          }}
        >
          <Tooltip title={params.value}>
            <Box
              component="span"
              sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
            >
              {truncateUuid(String(params.value))}
            </Box>
          </Tooltip>
          <IconButton
            className="copy-button"
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              void navigator.clipboard.writeText(String(params.value))
              showSuccessToast(t("admin.table.idCopied"))
            }}
            sx={{ padding: 0.125, minWidth: 20, width: 20, height: 20 }}
            aria-label={t("admin.table.copyId", { id: params.value })}
          >
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Box>
      ),
    },
    {
      field: "fullName",
      headerName: t("admin.table.fullName"),
      flex: 1,
      minWidth: 150,
      filterable: false,
      valueGetter: (_, row) => {
        if (row.first_name && row.last_name)
          return `${row.first_name} ${row.last_name}`
        return row.first_name || row.last_name || "—"
      },
      renderCell: (params) => (
        <Box
          component="span"
          sx={{ display: "inline-flex", alignItems: "center" }}
        >
          {params.value}
          {currentUser?.id === params.row.id && (
            <Badge sx={{ ml: 1 }} color="primary">
              {t("admin.table.you")}
            </Badge>
          )}
        </Box>
      ),
    },
    {
      field: "email",
      headerName: t("admin.table.email"),
      flex: 1,
      minWidth: 180,
      filterable: false,
    },
    {
      field: "is_superuser",
      headerName: t("admin.table.role"),
      type: "singleSelect",
      width: 120,
      filterOperators: STATUS_ROLE_FILTER_OPERATORS,
      valueOptions: [
        { value: true, label: t("admin.table.superuser") },
        { value: false, label: t("admin.table.user") },
      ],
    },
    {
      field: "is_active",
      headerName: t("admin.table.status"),
      type: "singleSelect",
      width: 100,
      filterOperators: STATUS_ROLE_FILTER_OPERATORS,
      valueOptions: [
        { value: true, label: t("admin.table.active") },
        { value: false, label: t("admin.table.inactive") },
      ],
    },
    {
      field: "actions",
      headerName: t("admin.table.actions"),
      sortable: false,
      filterable: false,
      width: 100,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <UserRowActions
          user={params.row as UserPublic}
          deleteDisabled={currentUser?.id === params.row.id}
        />
      ),
    },
  ]
  return (
    <>
      <Paper sx={{ width: "100%", mb: 2, p: 1 }}>
        <Box sx={{ width: "100%" }}>
          <DataGrid
            autoHeight
            localeText={localeText}
            rows={users}
            columns={columns}
            rowCount={rowCount}
            loading={isLoading}
            pagination
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25]}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={(model) =>
              setSortModel(model as typeof sortModel)
            }
            filterMode="server"
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            checkboxSelection
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={setRowSelectionModel}
            keepNonExistentRowsSelected
            slots={{ toolbar: CustomDataGridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                csvOptions: { disableToolbarButton: true },
                printOptions: { disableToolbarButton: true },
                onAddUser,
                onDeleteSelected: () => setBulkDialogOpen(true),
                rowSelectionModel,
              } as CustomToolbarProps,
            }}
            showToolbar
          />
        </Box>
      </Paper>
      <Dialog
        open={bulkDialogOpen}
        onClose={() =>
          !bulkDeleteMutation.isPending && setBulkDialogOpen(false)
        }
        aria-labelledby="bulk-delete-users-title"
      >
        <DialogTitle id="bulk-delete-users-title">
          {t("admin.rowActions.deleteDialog.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("admin.rowActions.deleteDialog.description")} (
            {selectedIdsForDelete.length})
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkDialogOpen(false)}
            disabled={bulkDeleteMutation.isPending}
          >
            {t("button.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={
              bulkDeleteMutation.isPending || selectedIdsForDelete.length === 0
            }
            onClick={() => bulkDeleteMutation.mutate(selectedIdsForDelete)}
          >
            {bulkDeleteMutation.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t("admin.rowActions.delete")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
