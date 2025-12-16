import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material"
import { StyledEngineProvider } from "@mui/material/styles"
import type { PropsWithChildren } from "react"
import { theme } from "@/theme"

export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </StyledEngineProvider>
  )
}
