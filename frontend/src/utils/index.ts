import type { AxiosError } from "axios"
import useCustomToast from "@/hooks/useCustomToast"

// Note: Email pattern validation messages are now handled via i18n in components
// This pattern is kept for the regex value only
export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address", // This will be overridden by i18n in components
}

export const namePattern = {
  value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
  message: "Invalid name",
}

// Note: These functions accept optional translation messages
// Components should pass translated messages when calling these functions
export const passwordRules = (
  isRequired = true,
  messages?: {
    required?: string
    minLength?: string
  },
) => {
  const rules: any = {
    minLength: {
      value: 8,
      message: messages?.minLength || "Password must be at least 8 characters",
    },
  }
  if (isRequired) {
    rules.required = messages?.required || "Password is required"
  }
  return rules
}

export const confirmPasswordRules = (
  getValues: () => any,
  isRequired = true,
  messages?: {
    required?: string
    validate?: string
  },
) => {
  const rules: any = {
    validate: (value: string) => {
      const password = getValues().password || getValues().new_password
      return (
        value === password || messages?.validate || "The passwords do not match"
      )
    },
  }
  if (isRequired) {
    rules.required = messages?.required || "Password confirmation is required"
  }
  return rules
}

export const handleError = (err: AxiosError) => {
  const { showErrorToast } = useCustomToast()
  const errDetail = (err.response?.data as any)?.detail
  let errorMessage = errDetail || "Something went wrong."
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    errorMessage = errDetail[0].msg
  }
  showErrorToast(errorMessage)
}

export const getUserInitials = (
  user:
    | {
        first_name?: string | null
        last_name?: string | null
        email?: string | null
      }
    | null
    | undefined,
): string => {
  if (!user) return "?"
  const { first_name, last_name, email } = user
  if (first_name && last_name) return `${first_name[0]}${last_name[0]}`
  if (first_name) return first_name[0]
  if (last_name) return last_name[0]
  return email?.[0] ?? "?"
}

export const truncateUuid = (uuid: string, length = 8) => {
  if (!uuid || uuid.length <= length) return uuid
  return `${uuid.substring(0, length)}...`
}

// Date and number formatting utilities
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatTime,
  formatUnit,
} from "./formatting"
