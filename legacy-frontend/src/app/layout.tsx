import RouteGuard from "@/components/auth-components/RouteGuard";
import Header from "@/components/Header";
import SideNav from "@/components/Sidenav";
import { Box } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import type { Metadata } from "next";
import "./globals.css";
import theme from "./theme";

export const metadata: Metadata = {
  title: {
    template: "%s - FertiScan",
    default: "FertiScan",
  },
};

/**
 * RootLayout component that sets up the main layout structure for the application.
 *
 * @param {Readonly<{ children: React.ReactNode }>} props - The props object containing children elements.
 * @returns {JSX.Element} The rendered layout component.
 *
 * This component includes:
 * - HTML structure with <html> and <body> tags.
 * - AppRouterCacheProvider for caching router data.
 * - ThemeProvider to apply the theme to the application.
 * - RouteGuard to protect routes and ensure proper navigation.
 * - SideNav component for the side navigation menu.
 * - Header component for the top header.
 * - Box component to wrap the children elements with specific styling.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <RouteGuard className="flex min-h-screen flex-col">
              <SideNav />
              <Header />
              <Box className="mt-16 flex-grow bg-white">{children}</Box>
            </RouteGuard>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
