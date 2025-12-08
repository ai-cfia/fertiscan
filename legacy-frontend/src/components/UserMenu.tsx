"use client";
import { usePlaceholder } from "@/classes/User";
import { AccountCircle, Logout } from "@mui/icons-material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { ListItemIcon, Menu, MenuItem, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the UserMenu component
 *
 * @property {HTMLElement | null} anchorElement - The element that serves as the anchor for the user menu.
 * @property {boolean} isUserMenuOpen - Indicates whether the user menu is open.
 * @property {Dispatch<SetStateAction<boolean>>} setIsUserMenuOpen - Function to set the open state of the user menu.
 * @property {Dispatch<SetStateAction<HTMLElement | null>>} setAnchorElement - Function to set the anchor element for the user menu.
 */
type UserMenuProps = {
  anchorElement: null | HTMLElement;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: Dispatch<SetStateAction<boolean>>;
  setAnchorElement: Dispatch<SetStateAction<HTMLElement | null>>;
};

/**
 * UserMenu Component
 *
 * This component renders a User Menu which appears when the user clicks on the
 * account icon in the header. It provides options to view the user's profile,
 * navigate to the dashboard, and log out. It also displays the current app version.
 *
 * @param {UserMenuProps} props - The properties of the UserMenu component
 * @param {HTMLElement | null} props.anchorElement - The element that serves as the anchor for the user menu
 * @param {boolean} props.isUserMenuOpen - Indicates whether the user menu is open
 * @param {Dispatch<SetStateAction<boolean>>} props.setIsUserMenuOpen - Function to set the open state of the user menu
 * @param {Dispatch<SetStateAction<HTMLElement | null>>} props.setAnchorElement - Function to set the anchor element for the user menu
 * @returns {ReactElement} A UserMenu component
 *
 */
const UserMenu = ({
  anchorElement,
  isUserMenuOpen,
  setIsUserMenuOpen,
  setAnchorElement,
}: UserMenuProps): ReactElement => {
  const { t } = useTranslation("header");
  const placeholderUser = usePlaceholder();
  const router = useRouter();

  // Close the user menu
  const handleClose = useCallback((): void => {
    setIsUserMenuOpen(false);
    setAnchorElement(null);
  }, [setIsUserMenuOpen, setAnchorElement]);

  // Navigate to the dashboard
  const handleDashboardClick = (): void => {
    router.push("/dashboard");
    handleClose();
  };

  // Log out the user
  const handleLogout = (): void => {
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
    location.reload();
    handleClose();
  };

  // Close the user menu when the window is resized
  useEffect(() => {
    window.addEventListener("resize", handleClose);
    return () => window.removeEventListener("resize", handleClose);
  }, [handleClose]);

  return (
    <Menu
      className="darkContainer"
      anchorEl={anchorElement}
      id="account-menu"
      open={isUserMenuOpen || false}
      onClose={handleClose}
      onClick={handleClose}
      data-testid="user-menu"
      transitionDuration={0}
      keepMounted
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      slotProps={{
        paper: {
          className:
            "!bg-sky-900 !text-white !shadow-2xl !filter !shadow-[rgba(0,0,0,0.5)_0px_2px_8px] ",
        },
      }}
    >
      <MenuItem
        className="min-w-[36px]"
        onClick={(event) => event.preventDefault()}
        data-testid="profile-menu-item"
        style={{ pointerEvents: "none", backgroundColor: "inherit" }}
      >
        <ListItemIcon aria-label={t("userMenu.altText.userIcon")}>
          <AccountCircle />
        </ListItemIcon>
        <Typography>{placeholderUser.getUsername()}</Typography>
      </MenuItem>
      <MenuItem
        onClick={handleDashboardClick}
        data-testid="dashboard-menu-item"
      >
        <ListItemIcon aria-label={t("userMenu.altText.dashboardIcon")}>
          <DashboardIcon />
        </ListItemIcon>
        <Typography>{t("userMenu.dashboard")}</Typography>
      </MenuItem>
      <MenuItem data-testid="logout-menu-item" onClick={handleLogout}>
        <ListItemIcon aria-label={t("userMenu.altText.logoutIcon")}>
          <Logout />
        </ListItemIcon>
        <Typography>{t("userMenu.logout")}</Typography>
      </MenuItem>
      <Typography
        variant="caption"
        textAlign="center"
        className="block"
        data-testid="app-version"
      >
        {t("userMenu.appVersion", { version: "alpha 0.1.5" })}
      </Typography>
    </Menu>
  );
};

export default UserMenu;
