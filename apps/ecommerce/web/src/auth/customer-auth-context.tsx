import { useEffect, useMemo, useState } from "react"

import type {
  CustomerProfile,
  CustomerProfileUpdatePayload,
  CustomerRegisterPayload,
} from "@ecommerce/shared"
import { useAuth } from "@cxapp/web/src/auth/auth-context"
import { isCustomerSurfaceUser } from "@cxapp/web/src/auth/auth-surface"

import { storefrontApi } from "../api/storefront-api"

type StorefrontCustomerAuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
  customer: CustomerProfile | null
  login: (payload: { email: string; password: string }) => Promise<void>
  register: (payload: CustomerRegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateProfile: (payload: CustomerProfileUpdatePayload) => Promise<void>
}

export function useStorefrontCustomerAuth(): StorefrontCustomerAuthContextValue {
  const auth = useAuth()
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const accessToken = auth.session?.accessToken ?? null
  const isPortalUser = isCustomerSurfaceUser(auth.user)

  useEffect(() => {
    let isCancelled = false

    async function bootstrap() {
      if (auth.isLoading) {
        return
      }

      if (!accessToken || !isPortalUser) {
        if (!isCancelled) {
          setCustomer(null)
          setIsProfileLoading(false)
        }
        return
      }

      setIsProfileLoading(true)

      try {
        const profile = await storefrontApi.getCustomerProfile(accessToken)

        if (!isCancelled) {
          setCustomer(profile)
        }
      } catch {
        if (!isCancelled) {
          setCustomer(null)
        }
      } finally {
        if (!isCancelled) {
          setIsProfileLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      isCancelled = true
    }
  }, [accessToken, auth.isLoading, isPortalUser])

  return useMemo(
    () => ({
      isLoading: auth.isLoading || isProfileLoading,
      isAuthenticated: auth.isAuthenticated && isPortalUser,
      accessToken,
      customer,
      login: async (payload) => {
        await auth.login({
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
        })
      },
      register: async (payload) => {
        await storefrontApi.registerCustomer(payload)
        await auth.login({
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
        })
      },
      logout: auth.logout,
      refresh: async () => {
        if (!accessToken || !isPortalUser) {
          setCustomer(null)
          return
        }

        setCustomer(await storefrontApi.getCustomerProfile(accessToken))
      },
      updateProfile: async (payload) => {
        if (!accessToken || !isPortalUser) {
          throw new Error("Customer session is required.")
        }

        setCustomer(await storefrontApi.updateCustomerProfile(accessToken, payload))
      },
    }),
    [
      accessToken,
      auth.isAuthenticated,
      auth.isLoading,
      auth.login,
      auth.logout,
      customer,
      isPortalUser,
      isProfileLoading,
    ]
  )
}
