import LogoutIcon from "@mui/icons-material/Logout"
import PersonIcon from "@mui/icons-material/Person"
import {
  Avatar,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import useAuth from "@/hooks/useAuth"
import { getUserInitials } from "@/utils"

const UserMenu = () => {
  const { t } = useTranslation("auth")
  const { user, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const handleLogout = async () => {
    logout()
    handleClose()
  }
  return (
    <>
      <IconButton
        onClick={handleClick}
        color="primary"
        size="small"
        sx={{ p: 0.5 }}
        aria-label={t("userMenu.myProfile")}
      >
        <Avatar sx={{ width: 32, height: 32, fontSize: "0.75rem" }}>
          {getUserInitials(user)}
        </Avatar>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem component={Link} to="/settings" onClick={handleClose}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText>{t("userMenu.myProfile")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText>{t("userMenu.logOut")}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

export default UserMenu
