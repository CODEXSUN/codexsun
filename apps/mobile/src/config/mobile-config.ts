import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"

type ExpoExtra = {
  apiBaseUrl?: string
}

const apiBaseUrlStorageKey = "codexsun.mobile.api-base-url"

function readExpoExtra(): ExpoExtra {
  const extra = Constants.expoConfig?.extra

  if (!extra || typeof extra !== "object") {
    return {}
  }

  return extra as ExpoExtra
}

export function getDefaultApiBaseUrl() {
  const envValue = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()

  if (envValue) {
    return resolveLocalhostApiBaseUrl(envValue)
  }

  const configValue = readExpoExtra().apiBaseUrl?.trim()

  if (configValue) {
    return resolveLocalhostApiBaseUrl(configValue)
  }

  return resolveLocalhostApiBaseUrl("http://localhost:3001")
}

export async function getApiBaseUrl() {
  const storedValue = (await AsyncStorage.getItem(apiBaseUrlStorageKey))?.trim()

  if (storedValue) {
    const migratedStoredValue = resolveLocalhostApiBaseUrl(storedValue)

    if (migratedStoredValue !== storedValue) {
      await AsyncStorage.setItem(apiBaseUrlStorageKey, migratedStoredValue)
    }

    return migratedStoredValue
  }

  return getDefaultApiBaseUrl()
}

export async function saveApiBaseUrl(value: string) {
  const normalizedValue = normalizeApiBaseUrl(value)

  if (!normalizedValue) {
    throw new Error("QR code does not contain a valid backend URL.")
  }

  await AsyncStorage.setItem(apiBaseUrlStorageKey, normalizedValue)

  return normalizedValue
}

export async function clearSavedApiBaseUrl() {
  await AsyncStorage.removeItem(apiBaseUrlStorageKey)
}

export function normalizeApiBaseUrl(value: string): string | null {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  const parsedConnectUrl = tryParseConnectUrl(trimmedValue)

  if (parsedConnectUrl) {
    return parsedConnectUrl
  }

  try {
    const parsedUrl = new URL(trimmedValue)

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null
    }

    return `${parsedUrl.origin}${parsedUrl.pathname}`.replace(/\/$/, "")
  } catch {
    return null
  }
}

export function createConnectQrValue(apiBaseUrl: string) {
  return `codexsun-mobile://connect?apiBaseUrl=${encodeURIComponent(apiBaseUrl)}`
}

function resolveLocalhostApiBaseUrl(value: string) {
  const normalizedValue = normalizeApiBaseUrl(value)

  if (!normalizedValue) {
    return value
  }

  try {
    const parsedUrl = new URL(normalizedValue)
    const hostname = parsedUrl.hostname.toLowerCase()

    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return normalizedValue
    }

    const expoHost = readExpoHostName()

    if (!expoHost) {
      return normalizedValue
    }

    parsedUrl.hostname = expoHost
    return `${parsedUrl.origin}${parsedUrl.pathname}`.replace(/\/$/, "")
  } catch {
    return normalizedValue
  }
}

function readExpoHostName() {
  const hostUri = Constants.expoConfig?.hostUri?.trim()

  if (!hostUri) {
    return null
  }

  const [host] = hostUri.split(":")
  return host?.trim() || null
}

function tryParseConnectUrl(value: string): string | null {
  try {
    const parsedUrl = new URL(value)

    if (
      parsedUrl.protocol !== "codexsun-mobile:" &&
      parsedUrl.protocol !== "codexsun:" &&
      parsedUrl.protocol !== "https:"
    ) {
      return null
    }

    const apiBaseUrl = parsedUrl.searchParams.get("apiBaseUrl")

    if (!apiBaseUrl) {
      return null
    }

    return normalizeApiBaseUrl(apiBaseUrl)
  } catch {
    return null
  }
}
