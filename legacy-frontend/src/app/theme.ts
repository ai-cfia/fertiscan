"use client";
import { colors } from "@mui/material";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#7B7B7B", // Dark grey (Default color)
    },
    secondary: {
      main: "#05486C", // Dark Blue (Selected)
    },
    error: {
      main: colors.red["500"],
    },
    success: {
      main: colors.green["500"],
    },
    background: {
      default: "#C5C5C5", // Light Grey
    },

  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
  logoSize: {
    width: {
      xs: "290px",
      sm: "390px",
      md: "512px",
    },
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          ".darkContainer &": {
            color: colors.common.white,
            "&:hover": {
              color: colors.common.black,
            },
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: "#666666",
          "&.Mui-active": {
            color: "#05486C", // Dark Blue when active
          },
          "&.Mui-completed": {
            color: colors.green["500"],
          },
          "&.Mui-error": {
            color: colors.red["500"],
          },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          "&.Mui-active": {
            color: "#05486C", // Dark Blue when active
          },
          "&.Mui-completed": {
            color: colors.green["500"],
          },
          "&.Mui-error": {
            color: colors.red["500"],
          },
          color: "#666666", // Default Grey
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          "&.header": {
            backgroundColor: "#05486C", // Dark Blue background
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          ".darkContainer &": {
            color: colors.common.white,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          ".darkContainer &": {
            color: colors.common.white,
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ".darkContainer &": {
            color: colors.common.white,
            "&:hover": {
              backgroundColor: "#032f47", // Dark blue background on hover within darkContainer
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          ".darkContainer &": {
            color: colors.common.white,
          },
        },
      },
    },
    MuiCollapse: {
      defaultProps: {
        timeout: 0,
      },
    },
    MuiCheckbox: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});
export default theme;
