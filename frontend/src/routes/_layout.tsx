import AddIcon from "@mui/icons-material/Add"
import MenuIcon from "@mui/icons-material/Menu"
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useParams,
} from "@tanstack/react-router"
import { AxiosError } from "axios"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import BreakpointIndicator from "@/components/Common/BreakpointIndicator"
import LanguageSwitcher from "@/components/Common/LanguageSwitcher"
import PageTopBanner from "@/components/Common/PageTopBanner"
import SidebarItems from "@/components/Common/SidebarItems"
import UploadCompletionSnackbar from "@/components/Common/UploadCompletionSnackbar"
import UploadProgressBanner from "@/components/Common/UploadProgressBanner"
import UserMenu from "@/components/Common/UserMenu"
import { isLoggedIn } from "@/hooks/useAuth"
import { useAppBarActionsStore } from "@/stores/useAppBarActions"
import { useBackendStatus } from "@/stores/useBackendStatus"
import { useBanner } from "@/stores/useBanner"
import { useLabelList } from "@/stores/useLabelList"
import { useLabelNew } from "@/stores/useLabelNew"

const drawerWidth = 256

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  // ============================== Route & Store ==============================
  const location = useLocation()
  const params = useParams({ strict: false })
  const { actions: appBarActions, clearActions } = useAppBarActionsStore()
  const normalizedPath = location.pathname.replace(/\/+$/, "")
  const isDataPage = /\/labels\/[^/]+\/(review|compliance)\/?$/.test(
    normalizedPath,
  )
  const productType = (params.productType as string) || "fertilizer"
  const { t } = useTranslation(["common", "labels", "errors"])
  const { fileTypeValidationErrors, clearFileTypeValidationErrors } =
    useLabelNew()
  const { error: labelListError, setError: setLabelListError } = useLabelList()
  const { ready: backendReady } = useBackendStatus()
  const { banners, showBanner, dismissBanner } = useBanner()
  const queryClient = useQueryClient()
  // ============================== State ==============================
  const [mobileOpen, setMobileOpen] = useState(false)
  // ============================== Helpers ==============================
  const isLabelsPage = location.pathname.includes("/labels")
  const getLabelListErrorMessage = useCallback(
    (error: unknown): string => {
      if (error instanceof AxiosError) {
        const detail = error.response?.data as any
        if (detail?.detail) {
          return typeof detail.detail === "string"
            ? detail.detail
            : Array.isArray(detail.detail) && detail.detail.length > 0
              ? detail.detail[0].msg || t("labels.errorOccurred")
              : t("labels.errorOccurred")
        }
        return error.message || t("labels.loadFailed")
      }
      return t("labels.loadFailedRetry")
    },
    [t],
  )
  const handleLabelListRetry = useCallback(() => {
    setLabelListError(null)
    queryClient.invalidateQueries({
      queryKey: ["labels"],
    })
  }, [setLabelListError, queryClient])
  const handleBackendRetry = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["backend", "health", "readiness"],
    })
  }, [queryClient])
  // ============================== Effects ==============================
  useEffect(() => {
    if (!isDataPage) {
      clearActions()
    }
  }, [isDataPage, clearActions])
  // ============================== Banner Management ==============================
  useEffect(() => {
    if (!backendReady) {
      showBanner({
        id: "backend-status",
        message: t("backend.unavailable", { ns: "common" }),
        severity: "error",
        onRetry: handleBackendRetry,
        onDismiss: () => dismissBanner("backend-status"),
      })
    } else {
      dismissBanner("backend-status")
    }
  }, [backendReady, showBanner, dismissBanner, t, handleBackendRetry])
  useEffect(() => {
    if (fileTypeValidationErrors.length > 0) {
      showBanner({
        id: "file-type-validation",
        message: t("fileType.invalidTitle", { ns: "errors" }),
        items: fileTypeValidationErrors,
        severity: "error",
        onDismiss: () => {
          clearFileTypeValidationErrors()
          dismissBanner("file-type-validation")
        },
      })
    } else {
      dismissBanner("file-type-validation")
    }
  }, [
    fileTypeValidationErrors,
    showBanner,
    dismissBanner,
    clearFileTypeValidationErrors,
    t,
  ])
  useEffect(() => {
    if (isLabelsPage && labelListError) {
      showBanner({
        id: "label-list-error",
        message: getLabelListErrorMessage(labelListError),
        severity: "error",
        onRetry: handleLabelListRetry,
        onDismiss: () => dismissBanner("label-list-error"),
      })
    } else {
      dismissBanner("label-list-error")
    }
  }, [
    isLabelsPage,
    labelListError,
    showBanner,
    dismissBanner,
    getLabelListErrorMessage,
    handleLabelListRetry,
  ])
  const [isClosing, setIsClosing] = useState(false)
  const handleDrawerClose = () => {
    setIsClosing(true)
    setMobileOpen(false)
  }
  const handleDrawerTransitionEnd = () => {
    setIsClosing(false)
  }
  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen)
    }
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label={t("aria.openDrawer")}
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: {
                xs: "block",
                sm: "block",
                md: isDataPage ? "block" : "none",
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t("app.title")}
          </Typography>
          {appBarActions}
          <Button
            color="primary"
            variant="contained"
            component={Link}
            to={`/${productType}/labels/new`}
            startIcon={<AddIcon />}
            sx={{ mr: 2 }}
          >
            {t("button.label")}
          </Button>
          <Box sx={{ mr: 2 }}>
            <LanguageSwitcher />
          </Box>
          <UserMenu />
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          mt: "64px",
        }}
      >
        <Box
          component="nav"
          sx={{
            width: { md: isDataPage ? 0 : drawerWidth },
            flexShrink: { md: 0 },
          }}
          aria-label={t("aria.navigation")}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            sx={{
              display: {
                xs: "block",
                sm: "block",
                md: isDataPage ? "block" : "none",
              },
              zIndex: (theme) => theme.zIndex.appBar - 1,
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                mt: "64px",
                height: "calc(100vh - 64px)",
              },
            }}
            slotProps={{
              root: {
                keepMounted: true,
              },
            }}
          >
            <SidebarItems
              onClose={handleDrawerClose}
              productType={productType}
            />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: {
                xs: "none",
                sm: "none",
                md: isDataPage ? "none" : "block",
              },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                mt: "64px",
                height: "calc(100vh - 64px)",
                zIndex: (theme) => theme.zIndex.appBar - 1,
              },
            }}
            open
          >
            <SidebarItems productType={productType} />
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {banners.map((banner) => (
            <PageTopBanner
              key={banner.id}
              message={banner.message}
              items={banner.items}
              severity={banner.severity}
              onRetry={banner.onRetry}
              onDismiss={banner.onDismiss}
            />
          ))}
          <UploadProgressBanner />
          <UploadCompletionSnackbar />
          <Box
            sx={{
              flexGrow: 1,
              p: isDataPage ? 0 : 3,
              ml: { md: isDataPage ? 0 : 6 },
              overflow: "auto",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
      <BreakpointIndicator />
    </Box>
  )
}
