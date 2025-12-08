import { AppBar, Box, Toolbar, Typography } from "@mui/material"
import { Link } from "@tanstack/react-router"
import UserMenu from "@/components/Common/UserMenu"

function Navbar() {
  return (
    <AppBar position="sticky">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="h6" component="div">
            FertiScan
          </Typography>
        </Link>
        <Box>
          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
