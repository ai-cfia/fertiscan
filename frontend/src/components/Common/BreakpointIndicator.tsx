// ============================== Dev breakpoint badge ==============================

import { Box, useMediaQuery, useTheme } from "@mui/material"

export default function BreakpointIndicator() {
  const theme = useTheme()
  const xs = useMediaQuery(theme.breakpoints.only("xs"))
  const sm = useMediaQuery(theme.breakpoints.only("sm"))
  const md = useMediaQuery(theme.breakpoints.only("md"))
  const lg = useMediaQuery(theme.breakpoints.only("lg"))
  const xl = useMediaQuery(theme.breakpoints.only("xl"))
  const xl2 = useMediaQuery(theme.breakpoints.up("2xl"))
  const getBreakpoint = () => {
    if (xl2) return "2xl"
    if (xl) return "xl"
    if (lg) return "lg"
    if (md) return "md"
    if (sm) return "sm"
    if (xs) return "xs"
    return "unknown"
  }
  if (import.meta.env.PROD) {
    return null
  }
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        right: "calc(2cm + 16px)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "4px 8px",
        borderRadius: 1,
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {getBreakpoint()}
    </Box>
  )
}
