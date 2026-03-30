// ============================== Auth server functions ==============================

import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { isAxiosError } from "axios"
import { LoginService, PrivateService, UsersService } from "#/api"
import type { PrivateUserCreate, UserPublic } from "#/api/types.gen"
import { createServerApiClient } from "#/server/api-client"
import { messageFromAxiosApiError } from "#/server/api-error-message"
import { getAppSession } from "#/server/session"

type LoginBody = { username: string; password: string }

function assertLoginBody(data: unknown): LoginBody {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.username !== "string" || typeof o.password !== "string") {
    throw new Error("Invalid body")
  }
  return { username: o.username, password: o.password }
}

function assertPrivateUserCreate(data: unknown): PrivateUserCreate {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (
    typeof o.email !== "string" ||
    typeof o.password !== "string" ||
    typeof o.first_name !== "string" ||
    typeof o.last_name !== "string"
  ) {
    throw new Error("Invalid body")
  }
  return {
    email: o.email,
    password: o.password,
    first_name: o.first_name,
    last_name: o.last_name,
  }
}

function assertEmailBody(data: unknown): { email: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.email !== "string") {
    throw new Error("Invalid body")
  }
  return { email: o.email }
}

function assertResetPasswordBody(data: unknown): {
  token: string
  new_password: string
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid body")
  }
  const o = data as Record<string, unknown>
  if (typeof o.token !== "string" || typeof o.new_password !== "string") {
    throw new Error("Invalid body")
  }
  return { token: o.token, new_password: o.new_password }
}

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertPrivateUserCreate(data))
  .handler(({ data }) => {
    const client = createServerApiClient()
    return PrivateService.createUserNoVerification({
      client,
      body: data,
      throwOnError: false,
    }).then((result) => {
      if (isAxiosError(result)) {
        return {
          ok: false as const,
          error: messageFromAxiosApiError(result, "Sign up failed"),
        }
      }
      throw redirect({ to: "/login", search: { redirect: undefined } })
    })
  })

export const recoverPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertEmailBody(data))
  .handler(({ data }) => {
    const client = createServerApiClient()
    return LoginService.recoverPassword({
      client,
      path: { email: data.email },
      throwOnError: false,
    }).then((result) => {
      if (isAxiosError(result)) {
        return {
          ok: false as const,
          error: messageFromAxiosApiError(result, "Request failed"),
        }
      }
      return { ok: true as const }
    })
  })

export const resetPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertResetPasswordBody(data))
  .handler(({ data }) => {
    const client = createServerApiClient()
    return LoginService.resetPassword({
      client,
      body: { token: data.token, new_password: data.new_password },
      throwOnError: false,
    }).then((result) => {
      if (isAxiosError(result)) {
        return {
          ok: false as const,
          error: messageFromAxiosApiError(result, "Reset failed"),
        }
      }
      throw redirect({ to: "/login", search: { redirect: undefined } })
    })
  })

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assertLoginBody(data))
  .handler(({ data }) => {
    const client = createServerApiClient()
    return LoginService.loginAccessToken({
      client,
      body: {
        username: data.username,
        password: data.password,
        grant_type: "password",
      },
      throwOnError: false,
    }).then((result) => {
      if (isAxiosError(result)) {
        return {
          ok: false as const,
          error: messageFromAxiosApiError(result, "Login failed"),
        }
      }
      const token = result.data?.access_token
      if (!token) {
        return { ok: false as const, error: "Login failed" }
      }
      return getAppSession().then((session) =>
        session.update({ accessToken: token }).then(() => {
          throw redirect({
            to: "/$productType",
            params: { productType: "fertilizer" },
          })
        }),
      )
    })
  })

export const logoutFn = createServerFn({ method: "POST" }).handler(() =>
  getAppSession().then((session) =>
    session.clear().then(() => {
      throw redirect({ to: "/login", search: { redirect: undefined } })
    }),
  ),
)

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
  (): Promise<UserPublic | null> =>
    getAppSession().then((session) => {
      const token = session.data.accessToken
      if (!token) {
        return null
      }
      const client = createServerApiClient(() => token)
      return UsersService.readUserMe({
        client,
        throwOnError: false,
      }).then((result) => {
        if (isAxiosError(result)) {
          const status = result.response?.status
          if (status === 401 || status === 403) {
            return session.clear().then(() => null)
          }
          return null
        }
        return result.data ?? null
      })
    }),
)
