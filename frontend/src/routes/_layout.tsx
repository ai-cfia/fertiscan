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
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router"
import { useState } from "react"
import BackendStatusBanner from "@/components/Common/BackendStatusBanner"
import SidebarItems from "@/components/Common/SidebarItems"
import UserMenu from "@/components/Common/UserMenu"
import { isLoggedIn } from "@/hooks/useAuth"

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
  const [mobileOpen, setMobileOpen] = useState(false)
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
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: "block", sm: "block", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Label Inspection
          </Typography>
          <Button
            color="primary"
            variant="contained"
            component={Link}
            to="/fertilizer/scan"
            startIcon={<AddIcon />}
            sx={{ mr: 2 }}
          >
            Scan
          </Button>
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
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="navigation"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            sx={{
              display: { xs: "block", sm: "block", md: "none" },
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
            <SidebarItems onClose={handleDrawerClose} />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "none", md: "block" },
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
            <SidebarItems />
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
          <Box
            sx={{
              flexGrow: 1,
              p: 3,
              ml: { md: 6 },
              overflow: "auto",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
