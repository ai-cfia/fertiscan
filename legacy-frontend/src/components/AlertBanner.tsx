"use client";
import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef } from "react";
import useAlertStore from "../stores/alertStore";
import { useTranslation } from "react-i18next";

// The time in milliseconds after which the alert banner automatically dismisses.
const AUTO_DISMISS_TIME =
  Number(process.env.NEXT_PUBLIC_ALERT_BANNER_AUTO_DISMISS_TIME) || 5000;

/**
 * AlertBanner component displays an alert message at the top of the screen.
 * The alert automatically dismisses after a specified time unless the user interacts with it.
 *
 * @internal
 * The component uses a `useRef` to keep track of the auto-dismiss timer and `useCallback` to memoize the timer start function.
 * The `useEffect` hook is used to start the timer when an alert is present and clear it when the component unmounts or the alert changes.
 *
 * @component
 * @param {void}
 * @returns {JSX.Element} The rendered AlertBanner component.
 */
const AlertBanner: React.FC = () => {
  const { t } = useTranslation("alertBanner");
  const { alert, hideAlert } = useAlertStore();
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the startAutoDismissTimer function to prevent unnecessary re-renders.
  const startAutoDismissTimer = useCallback(() => {
    autoDismissTimerRef.current = setTimeout(() => {
      hideAlert();
    }, AUTO_DISMISS_TIME);
  }, [hideAlert]);

  // Clear the auto-dismiss timer when the component unmounts or the alert changes.
  const clearAutoDismissTimer = () => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
  };

  // Start the auto-dismiss timer when an alert is present.
  useEffect(() => {
    if (alert) {
      startAutoDismissTimer();
    }
    return () => clearAutoDismissTimer();
  }, [alert, hideAlert, startAutoDismissTimer]);

  return (
    <Box className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg"
      data-testid="alert-banner-container">
      <Collapse in={Boolean(alert)}>
        {alert && (
          <Alert
            severity={alert.type}
            onMouseEnter={clearAutoDismissTimer}
            onMouseLeave={startAutoDismissTimer}
            data-testid="alert-banner"
            action={
              <IconButton
                size="small"
                onClick={hideAlert}
                data-testid="alert-close-button"
                aria-label={t("alt.closeIcon")}
              >
                <CloseIcon color={alert.type} />
              </IconButton>
            }
          >
            <Typography
              className="overflow-hidden text-ellipsis"
              variant="body2"
              color="inherit"
              data-testid="alert-message"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {alert.message}
            </Typography>
          </Alert>
        )}
      </Collapse>
    </Box>
  );
};

export default AlertBanner;
