"use client";
import UserMenu from "@/components/UserMenu";
import useAlertStore from "@/stores/alertStore";
import useUIStore from "@/stores/uiStore";
import useBreakpoints from "@/utils/client/useBreakpoints";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import i18next from "i18next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AlertBanner from "./AlertBanner";
import "../app/i18n";

/**
 * Header component that displays the application header with navigation, logo, language toggle, and user account menu.
 *
 * @component
 * @returns {JSX.Element} The rendered Header component.
 *
 * @function
 * - `handleLanguageChange` - Handles the language change event.
 * - `handleUserMenuToggle` - Toggles the user menu.
 * - `changeLanguage` - Changes the application language.
 */
const Header = () => {
  const { t, i18n } = useTranslation("header");
  const { t: tAlert } = useTranslation("alertBanner");
  const { t: tDebug } = useTranslation("translation");
  const theme = useTheme();
  const { isDownXs, isBetweenXsSm, isBetweenSmMd } = useBreakpoints();
  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { showAlert } = useAlertStore();

  const handleLanguageChange = (lng: string) => {
    showAlert(tAlert("languageChanged", { lng }), "info");
  };

  i18n.on("languageChanged", handleLanguageChange);
  if (process.env.NEXT_PUBLIC_DEBUG === "true") {
    console.log(tDebug("debugMessage"));
  }

  const handleUserMenuToggle = (event: React.MouseEvent<HTMLElement>) => {
    setIsUserMenuOpen(true);
    setAnchorElement(event.currentTarget);
  };

  const changeLanguage = (lang: string) => {
    i18next.changeLanguage(lang, (err, t) => {
      if (err) return console.log(t("error.loadingError"), err);
      t("key");
      setLanguage(lang);
    });
  };

  return (
    <AppBar className="header" data-testid="header-appbar">
      <Toolbar
        className="justify-between h-full darkContainer"
        data-testid="header-toolbar"
      >
        {/* Navigation menu toggle button on the left */}
        <IconButton
          aria-label={t("altText.sideMenuToggleAlt")}
          edge="start"
          onClick={toggleSidebar}
          data-testid="menu-toggle-button"
        >
          <MenuIcon fontSize="large" />
        </IconButton>

        {/* Logo container in the center */}
        <Box
          sx={{
            ...theme.logoSize,
          }}
          data-testid="logo-container"
        >
          <Link href="https://inspection.canada.ca">
            <Image
              className="cursor-pointer !relative"
              src="/img/CFIA_FIP_FR_WHITE_1.png"
              alt={t("altText.logoCFIAAlt")}
              fill={true}
              priority
              data-testid="logo-image"
              aria-label={t("altText.logoCFIAAlt")}
            />
          </Link>
        </Box>

        {/* User interaction components on the right */}
        <Box className="flex" data-testid="user-interaction-box">
          {/* Language toggle button */}
          <Button
            className="align-center"
            onClick={() => changeLanguage(language === "en" ? "fr" : "en")}
            data-testid="language-toggle-button"
          >
            <Typography
              className="normal-case underline"
              data-testid="language-text"
            >
              {t(
                isDownXs || isBetweenXsSm || isBetweenSmMd
                  ? "language.short"
                  : "language.full",
                {
                  lng: language === "en" ? "fr" : "en",
                },
              )}
            </Typography>
          </Button>

          {/* User account icon button */}
          <IconButton
            aria-label={t("altText.userAccountAlt")}
            className="self-center"
            onClick={handleUserMenuToggle}
            data-testid="user-account-button"
          >
            <AccountCircleIcon fontSize="large" />
          </IconButton>
        </Box>
      </Toolbar>

      {/* User menu */}
      <UserMenu
        anchorElement={anchorElement}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        setAnchorElement={setAnchorElement}
      />

      <AlertBanner />
    </AppBar>
  );
};

export default Header;
