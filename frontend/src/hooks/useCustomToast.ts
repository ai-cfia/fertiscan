import { useSnackbar } from "@/components/SnackbarProvider"

const useCustomToast = () => {
  const { showSuccessToast, showErrorToast } = useSnackbar()
  return { showSuccessToast, showErrorToast }
}

export default useCustomToast
