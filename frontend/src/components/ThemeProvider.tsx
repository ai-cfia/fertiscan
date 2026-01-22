import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material"
import { createTheme, StyledEngineProvider } from "@mui/material/styles"
import type { PropsWithChildren } from "react"

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xs: true
    sm: true
    md: true
    lg: true
    xl: true
    "2xl": true
  }
}

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      "2xl": 1920,
    },
  },
})

export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <MuiThemeProvider theme={theme} noSsr>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </StyledEngineProvider>
  )
}
