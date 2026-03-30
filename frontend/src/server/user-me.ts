// ============================== Current user (session API) ==============================
// --- Browser has no API bearer; use session token on server ---
import { createServerFn } from "@tanstack/react-start"
import { isAxiosError } from "axios"
import { UsersService } from "#/api"
import type { UpdatePassword, UserUpdate, UserUpdateMe } from "#/api/types.gen"
import { requireAuthedApiClient } from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"

function assertUpdatePassword(data: unknown): UpdatePassword {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (
    typeof o.current_password !== "string" ||
    typeof o.new_password !== "string"
  ) {
    throw new Error("Invalid body")
  }
  return {
    current_password: o.current_password,
    new_password: o.new_password,
  }
}

function assertUserUpdateMe(data: unknown): UserUpdateMe {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (
    typeof o.email !== "string" ||
    typeof o.first_name !== "string" ||
    typeof o.last_name !== "string"
  ) {
    throw new Error("Invalid body")
  }
  return {
    email: o.email || null,
    first_name: o.first_name || null,
    last_name: o.last_name || null,
  }
}

function assertUserUpdateById(data: unknown): {
  userId: string
  body: UserUpdate
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.userId !== "string") {
    throw new Error("Invalid userId")
  }
  const b = o.body
  if (!b || typeof b !== "object") {
    throw new Error("Invalid body")
  }
  const r = b as Record<string, unknown>
  if (
    typeof r.email !== "string" ||
    typeof r.first_name !== "string" ||
    typeof r.last_name !== "string" ||
    typeof r.is_active !== "boolean" ||
    typeof r.is_superuser !== "boolean"
  ) {
    throw new Error("Invalid body")
  }
  return {
    userId: o.userId,
    body: {
      email: r.email || null,
      first_name: r.first_name || null,
      last_name: r.last_name || null,
      is_active: r.is_active,
      is_superuser: r.is_superuser,
    },
  }
}

export const updatePasswordMeFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertUpdatePassword(data))
  .handler(async ({ data }) => {
    const client = await requireAuthedApiClient()
    const res = await UsersService.updatePasswordMe({
      client,
      body: data,
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(
        messageFromAxiosApiError(res, "Failed to update password"),
      )
    }
  })

export const deleteUserMeFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const client = await requireAuthedApiClient()
    const res = await UsersService.deleteUserMe({
      client,
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to delete account"))
    }
  },
)

export const updateUserMeFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertUserUpdateMe(data))
  .handler(async ({ data }) => {
    const client = await requireAuthedApiClient()
    const res = await UsersService.updateUserMe({
      client,
      body: data,
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to update user"))
    }
  })

export const updateUserByIdFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertUserUpdateById(data))
  .handler(async ({ data }) => {
    const client = await requireAuthedApiClient()
    const res = await UsersService.updateUser({
      client,
      path: { user_id: data.userId },
      body: data.body,
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to update user"))
    }
  })
