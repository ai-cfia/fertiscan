import { Box, Container, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()
  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Hi,{" "}
          {currentUser?.first_name ||
            currentUser?.last_name ||
            currentUser?.email}{" "}
          👋🏼
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, nice to see you again!
        </Typography>
      </Box>
    </Container>
  )
}
