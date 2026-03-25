// ============================== Sidebar navigation ==============================

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import DashboardIcon from "@mui/icons-material/Dashboard"
import InventoryIcon from "@mui/icons-material/Inventory"
import LabelIcon from "@mui/icons-material/Label"
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
import { getRouteApi, isRedirect, Link, useLocation } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { useTranslation } from "react-i18next"
import { logoutFn } from "#/server/auth"

const layoutRouteApi = getRouteApi("/_layout")

interface SidebarItemsProps {
  onClose?: () => void
  productType?: string
}

export default function SidebarItems({
  onClose,
  productType = "fertilizer",
}: SidebarItemsProps) {
  const { t } = useTranslation("common")
  const { user } = layoutRouteApi.useRouteContext()
  const location = useLocation()
  const queryClient = useQueryClient()
  const runLogout = useServerFn(logoutFn)
  const dashboardPath = `/${productType}`
  const navItems = [
    { text: t("sidebar.dashboard"), icon: DashboardIcon, to: dashboardPath },
    {
      text: t("sidebar.labels"),
      icon: LabelIcon,
      to: `/${productType}/labels`,
    },
    {
      text: t("sidebar.products"),
      icon: InventoryIcon,
      to: `/${productType}/products`,
    },
    { text: t("sidebar.userSettings"), icon: SettingsIcon, to: "/settings" },
    ...(user?.is_superuser
      ? [
          {
            text: t("sidebar.admin"),
            icon: AdminPanelSettingsIcon,
            to: "/admin",
          },
        ]
      : []),
  ]
  const handleLogout = async () => {
    try {
      queryClient.removeQueries({ queryKey: ["currentUser"] })
      await runLogout()
    } catch (e) {
      if (isRedirect(e)) throw e
    }
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
          const isActive =
            location.pathname === item.to ||
            (item.to === dashboardPath &&
              (location.pathname === dashboardPath ||
                location.pathname === `${dashboardPath}/`)) ||
            (item.to.includes("/labels") &&
              location.pathname.startsWith(`/${productType}/labels`)) ||
            (item.to.includes("/products") &&
              location.pathname.startsWith(`/${productType}/products`))
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
          {user?.email && (
            <ListSubheader
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t("sidebar.loggedInAs", { email: user.email })}
            </ListSubheader>
          )}
          <ListItem disablePadding>
            <ListItemButton onClick={() => void handleLogout()}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary={t("sidebar.logOut")} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}
