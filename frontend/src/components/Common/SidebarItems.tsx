import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import HomeIcon from "@mui/icons-material/Home"
import SettingsIcon from "@mui/icons-material/Settings"
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import type { UserPublic } from "@/api"

const items = [
  { icon: HomeIcon, title: "Dashboard", path: "/" },
  { icon: SettingsIcon, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const finalItems = currentUser?.is_superuser
    ? [
        ...items,
        { icon: AdminPanelSettingsIcon, title: "Admin", path: "/admin" },
      ]
    : items
  return (
    <List>
      {finalItems.map(({ icon: Icon, title, path }) => (
        <ListItem key={title} disablePadding>
          <ListItemButton component={RouterLink} to={path} onClick={onClose}>
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={title} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}

export default SidebarItems
