export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address",
}
export const passwordRules = (
  isRequired = true,
  messages?: { required?: string; minLength?: string },
) => {
  const rules: {
    minLength: { value: number; message: string }
    required?: string
  } = {
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
type GetValuesLike = () => {
  password?: string
  new_password?: string
}
export const confirmPasswordRules = (
  getValues: GetValuesLike,
  isRequired = true,
  messages?: { required?: string; validate?: string },
) => {
  const rules: {
    required?: string
    validate: (value: string) => true | string
  } = {
    validate: (value: string) => {
      const v = getValues()
      const pwd = v.password ?? v.new_password
      return value === pwd || messages?.validate || "The passwords do not match"
    },
  }
  if (isRequired) {
    rules.required = messages?.required || "Password confirmation is required"
  }
  return rules
}
