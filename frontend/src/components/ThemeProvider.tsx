import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material"
import { createTheme, StyledEngineProvider } from "@mui/material/styles"
import type { PropsWithChildren } from "react"

const theme = createTheme({
  colorSchemes: {
    dark: true,
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
