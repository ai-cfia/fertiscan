// ============================== Admin users (superuser API) ==============================
// --- Session bearer on server ---
import { createServerFn } from "@tanstack/react-start"
import { isAxiosError } from "axios"
import { UsersService } from "#/api"
import type {
  LimitOffsetPageUserPublic,
  UserCreateWritable,
} from "#/api/types.gen"
import { requireAuthedApiClient } from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"

export type ReadUsersListInput = {
  offset: number
  limit: number
  order_by?: string
  order?: string
  search?: string | null
  is_active?: boolean | null
  is_superuser?: boolean | null
}

function assertReadUsersListInput(data: unknown): ReadUsersListInput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (
    typeof o.offset !== "number" ||
    !Number.isFinite(o.offset) ||
    o.offset < 0
  ) {
    throw new Error("Invalid offset")
  }
  if (typeof o.limit !== "number" || !Number.isFinite(o.limit) || o.limit < 1) {
    throw new Error("Invalid limit")
  }
  const q: ReadUsersListInput = { offset: o.offset, limit: o.limit }
  if (typeof o.order_by === "string") {
    q.order_by = o.order_by
  }
  if (o.order === "asc" || o.order === "desc") {
    q.order = o.order
  }
  if (typeof o.search === "string") {
    q.search = o.search
  }
  if (o.search === null) {
    q.search = null
  }
  if (
    "is_active" in o &&
    (o.is_active === null || typeof o.is_active === "boolean")
  ) {
    q.is_active = o.is_active as boolean | null
  }
  if (
    "is_superuser" in o &&
    (o.is_superuser === null || typeof o.is_superuser === "boolean")
  ) {
    q.is_superuser = o.is_superuser as boolean | null
  }
  return q
}

function assertUserCreateWritable(data: unknown): UserCreateWritable {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.email !== "string" || typeof o.password !== "string") {
    throw new Error("Invalid body")
  }
  return {
    email: o.email,
    password: o.password,
    first_name:
      typeof o.first_name === "string" || o.first_name === null
        ? (o.first_name as string | null)
        : undefined,
    last_name:
      typeof o.last_name === "string" || o.last_name === null
        ? (o.last_name as string | null)
        : undefined,
    is_active: typeof o.is_active === "boolean" ? o.is_active : undefined,
    is_superuser:
      typeof o.is_superuser === "boolean" ? o.is_superuser : undefined,
  }
}

function assertUserId(data: unknown): { userId: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.userId !== "string") {
    throw new Error("Invalid userId")
  }
  return { userId: o.userId }
}

function assertUserIds(data: unknown): { userIds: string[] } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const ids = (data as Record<string, unknown>).userIds
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) {
    throw new Error("Invalid userIds")
  }
  return { userIds: ids as string[] }
}

export const readUsersListFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertReadUsersListInput(data))
  .handler(async ({ data }): Promise<LimitOffsetPageUserPublic> => {
    const client = await requireAuthedApiClient()
    const res = await UsersService.readUsers({
      client,
      query: {
        offset: data.offset,
        limit: data.limit,
        order_by: data.order_by,
        order: data.order,
        search: data.search ?? undefined,
        is_active: data.is_active ?? undefined,
        is_superuser: data.is_superuser ?? undefined,
      },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to load users"))
    }
    if (!res.data) {
      throw new Error("Failed to load users")
    }
    return res.data
  })

export const createAdminUserFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertUserCreateWritable(data))
  .handler(async ({ data }) => {
    const client = await requireAuthedApiClient()
    const res = await UsersService.createUser({
      client,
      body: data,
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to create user"))
    }
  })

export const deleteUserByIdAdminFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertUserId(data))
  .handler(async ({ data }) => {
    const client = await requireAuthedApiClient()
    const res = await UsersService.deleteUser({
      client,
      path: { user_id: data.userId },
      throwOnError: false,
    })
    if (isAxiosError(res)) {
      throw new Error(messageFromAxiosApiError(res, "Failed to delete user"))
    }
  })

export const deleteUsersByIdsAdminFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertUserIds(data))
  .handler(async ({ data }) => {
    const client = await requireAuthedApiClient()
    for (const userId of data.userIds) {
      const res = await UsersService.deleteUser({
        client,
        path: { user_id: userId },
        throwOnError: false,
      })
      if (isAxiosError(res)) {
        throw new Error(
          messageFromAxiosApiError(res, `Failed to delete user ${userId}`),
        )
      }
    }
  })
