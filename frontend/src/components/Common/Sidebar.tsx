import LogoutIcon from "@mui/icons-material/Logout"
import MenuIcon from "@mui/icons-material/Menu"
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { UserPublic } from "@/client"
import SidebarItems from "@/components/Common/SidebarItems"
import useAuth from "@/hooks/useAuth"

const drawerWidth = 240

const Sidebar = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [mobileOpen, setMobileOpen] = useState(false)
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }
  const drawer = (
    <Box>
      <SidebarItems onClose={() => setMobileOpen(false)} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Log Out" />
          </ListItemButton>
        </ListItem>
      </List>
      {currentUser?.email && (
        <Typography variant="caption" sx={{ p: 2, display: "block" }}>
          Logged in as: {currentUser.email}
        </Typography>
      )}
    </Box>
  )
  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ position: "absolute", zIndex: 1300, m: 1 }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            position: isMobile ? "fixed" : "relative",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  )
}

export default Sidebar
