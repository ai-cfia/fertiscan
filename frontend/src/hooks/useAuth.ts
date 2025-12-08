import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { AxiosError } from "axios"
import { useState } from "react"
import {
  type BodyLoginLoginAccessToken as AccessToken,
  LoginService,
  PrivateService,
  type PrivateUserCreate,
  type UserPublic,
  UsersService,
} from "@/client"
import { handleError } from "@/utils"

export const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await UsersService.readUserMe()
      if (response.error !== undefined) {
        throw response.error
      }
      return response.data ?? null
    },
    enabled: isLoggedIn(),
  })

  const signUpMutation = useMutation({
    mutationFn: async (data: PrivateUserCreate) => {
      const response = await PrivateService.createUserNoVerification({ body: data })
      if (response.error !== undefined) {
        throw response.error
      }
      return response.data
    },
    onSuccess: () => {
      navigate({ to: "/login" })
    },
    onError: (err: AxiosError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const login = async (data: AccessToken) => {
    const response = await LoginService.loginAccessToken({
      body: data,
    })
    if (response.error !== undefined) {
      throw response.error
    }
    localStorage.setItem("access_token", response.data.access_token)
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/" })
    },
    onError: (err: AxiosError) => {
      handleError(err)
    },
  })

  const logout = () => {
    localStorage.removeItem("access_token")
    navigate({ to: "/login" })
  }

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
    error,
    resetError: () => setError(null),
  }
}

export default useAuth
