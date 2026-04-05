import { useQuery } from "@tanstack/react-query"

import type { CompanyBrandProfile } from "@cxapp/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import type { AppSettingsSnapshot } from "../../../../framework/shared/index.js"

import { queryKeys } from "./query-keys"

declare global {
  interface Window {
    __CODEXSUN_APP_SETTINGS__?: AppSettingsSnapshot
  }
}

async function requestJson<T>(path: string, withAuth = false) {
  const accessToken = withAuth ? getStoredAccessToken() : null
  const response = await fetch(path, {
    cache: "no-store",
    headers: accessToken
      ? {
          authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })

  if (response.status === 404) {
    return { item: null as T | null }
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`)
  }

  return (await response.json()) as { item?: T }
}

export function useRuntimeBrandQuery() {
  return useQuery({
    queryKey: queryKeys.runtimeBrand,
    queryFn: async () => {
      try {
        const hasAccessToken = Boolean(getStoredAccessToken())
        const payload = hasAccessToken
          ? await requestJson<CompanyBrandProfile>("/internal/v1/cxapp/company-brand", true)
          : await requestJson<CompanyBrandProfile>("/public/v1/brand-profile")

        return payload.item ?? null
      } catch {
        return null
      }
    },
    retry: false,
  })
}

export function useRuntimeAppSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.runtimeAppSettings,
    queryFn: async () => {
      if (window.__CODEXSUN_APP_SETTINGS__) {
        return window.__CODEXSUN_APP_SETTINGS__ ?? null
      }

      const payload = await requestJson<AppSettingsSnapshot>("/public/v1/app-settings")
      const settings = payload.item ?? null
      window.__CODEXSUN_APP_SETTINGS__ = settings ?? undefined

      return settings
    },
    initialData: () => window.__CODEXSUN_APP_SETTINGS__ ?? null,
    retry: false,
  })
}
