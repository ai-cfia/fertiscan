import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import DashboardIcon from "@mui/icons-material/Dashboard"
import LogoutIcon from "@mui/icons-material/Logout"
import SettingsIcon from "@mui/icons-material/Settings"
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useLocation } from "@tanstack/react-router"
import type { UserPublic } from "@/api"
import useAuth from "@/hooks/useAuth"

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const navItems = [
    { text: "Dashboard", icon: DashboardIcon, to: "/" },
    { text: "User Settings", icon: SettingsIcon, to: "/settings" },
    ...(user?.is_superuser
      ? [{ text: "Admin", icon: AdminPanelSettingsIcon, to: "/admin" }]
      : []),
  ]
  const handleLogout = () => {
    logout()
    onClose?.()
  }
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <List>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.to}
                selected={isActive}
                onClick={onClose}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "action.selected",
                    color: "text.primary",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "text.primary",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "text.primary" : "action.active",
                  }}
                >
                  <item.icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      sx: {
                        color: isActive ? "text.primary" : "text.secondary",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Box sx={{ mt: "auto" }}>
        <Divider />
        <List>
          {currentUser?.email && (
            <ListSubheader
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Logged in as: {currentUser.email}
            </ListSubheader>
          )}
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Log Out" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}

export default SidebarItems
