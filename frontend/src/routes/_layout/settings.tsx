import { Box, Container, Tab, Tabs, Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const { user: currentUser } = useAuth()
  const [value, setValue] = useState(0)
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  if (!currentUser) {
    return null
  }
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ py: 3 }}>
        User Settings
      </Typography>
      <Tabs value={value} onChange={handleChange}>
        <Tab label="My profile" />
        {!currentUser.is_superuser && <Tab label="Password" />}
        {!currentUser.is_superuser && <Tab label="Appearance" />}
        {!currentUser.is_superuser && <Tab label="Danger zone" />}
      </Tabs>
      <Box sx={{ mt: 3 }}>
        {value === 0 && (
          <Typography variant="body1">User Information</Typography>
        )}
        {value === 1 && !currentUser.is_superuser && (
          <Typography variant="body1">Change Password</Typography>
        )}
        {value === 2 && !currentUser.is_superuser && (
          <Typography variant="body1">Appearance</Typography>
        )}
        {value === 3 && !currentUser.is_superuser && (
          <Typography variant="body1">Delete Account</Typography>
        )}
      </Box>
    </Container>
  )
}
