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
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useParams,
} from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import BackendStatusBanner from "@/components/Common/BackendStatusBanner"
import BreakpointIndicator from "@/components/Common/BreakpointIndicator"
import LabelListErrorBanner from "@/components/Common/LabelListErrorBanner"
import LanguageSwitcher from "@/components/Common/LanguageSwitcher"
import SidebarItems from "@/components/Common/SidebarItems"
import UploadCompletionSnackbar from "@/components/Common/UploadCompletionSnackbar"
import UploadProgressBanner from "@/components/Common/UploadProgressBanner"
import UserMenu from "@/components/Common/UserMenu"
import ValidationErrorBanner from "@/components/Common/ValidationErrorBanner"
import { isLoggedIn } from "@/hooks/useAuth"
import { useAppBarActionsStore } from "@/stores/useAppBarActions"

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
  const isNewLabelPage = /\/labels\/new\/?$/.test(normalizedPath)
  const isDataPage = /\/labels\/[^/]+\/review\/?$/.test(normalizedPath)
  const productType = (params.productType as string) || "fertilizer"
  const { t } = useTranslation(["common", "labels"])
  // ============================== State ==============================
  const [mobileOpen, setMobileOpen] = useState(false)
  // ============================== Effects ==============================
  useEffect(() => {
    if (!isNewLabelPage && !isDataPage) {
      clearActions()
    }
  }, [isNewLabelPage, isDataPage, clearActions])
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
          {!isNewLabelPage ? (
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
          ) : null}
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
          <BackendStatusBanner />
          <ValidationErrorBanner />
          <UploadProgressBanner />
          <LabelListErrorBanner />
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
