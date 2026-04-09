import { useQuery } from "@tanstack/react-query"

import type { CompanyBrandProfile } from "@cxapp/shared"
import { getStoredAccessToken, readStoredAuthSession } from "@cxapp/web/src/auth/session-storage"
import type { AppSettingsSnapshot } from "../../../../framework/shared/index.js"

import { fallbackRuntimeAppSettings } from "../features/runtime-app-settings/runtime-app-settings-fallback"
import { queryKeys } from "./query-keys"

declare global {
  interface Window {
    __CODEXSUN_APP_SETTINGS__?: AppSettingsSnapshot
  }
}

const DEVTOOLS_NAMES_STORAGE_KEY = "codexsun.ui.developer-tools.show-technical-names"

function readShowTechnicalNamesOverride() {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(DEVTOOLS_NAMES_STORAGE_KEY)

  if (value === "true") {
    return true
  }

  if (value === "false") {
    return false
  }

  return null
}

function applyAppSettingsOverrides(settings: AppSettingsSnapshot) {
  const showTechnicalNamesOverride = readShowTechnicalNamesOverride()

  if (showTechnicalNamesOverride == null) {
    return settings
  }

  return {
    ...settings,
    uiDeveloperTools: {
      ...settings.uiDeveloperTools,
      showTechnicalNames: showTechnicalNamesOverride,
    },
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
        const storedSession = readStoredAuthSession()
        const shouldUseInternalBrandRoute =
          Boolean(storedSession?.accessToken) &&
          Boolean(
            storedSession?.user.isSuperAdmin ||
              storedSession?.user.actorType === "admin" ||
              storedSession?.user.actorType === "staff"
          )
        const payload = shouldUseInternalBrandRoute
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
        return applyAppSettingsOverrides(window.__CODEXSUN_APP_SETTINGS__) ?? null
      }

      try {
        const payload = await requestJson<AppSettingsSnapshot>("/public/v1/app-settings")
        const settings = applyAppSettingsOverrides(payload.item ?? fallbackRuntimeAppSettings)
        window.__CODEXSUN_APP_SETTINGS__ = settings

        return settings
      } catch {
        const settings = applyAppSettingsOverrides(fallbackRuntimeAppSettings)
        window.__CODEXSUN_APP_SETTINGS__ = settings
        return settings
      }

    },
    initialData: () =>
      window.__CODEXSUN_APP_SETTINGS__
        ? applyAppSettingsOverrides(window.__CODEXSUN_APP_SETTINGS__)
        : undefined,
    retry: false,
  })
}
