import { Alert, Snackbar } from "@mui/material"
import { createContext, type ReactNode, useContext, useState } from "react"

interface SnackbarContextType {
  showSuccessToast: (message: string) => void
  showErrorToast: (message: string) => void
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined,
)

export const useSnackbar = () => {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider")
  }
  return context
}

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [severity, setSeverity] = useState<"success" | "error">("success")
  const showSuccessToast = (msg: string) => {
    setMessage(msg)
    setSeverity("success")
    setOpen(true)
  }
  const showErrorToast = (msg: string) => {
    setMessage(msg)
    setSeverity("error")
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
  }
  return (
    <SnackbarContext.Provider value={{ showSuccessToast, showErrorToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}
