import { performance } from "node:perf_hooks"

import {
  readFrappeEnvConfig,
  type FrappeEnvConfig,
} from "../config/frappe.js"

type FrappeRequestInput = {
  path: string
  method?: string
  headers?: Headers | Record<string, string>
  body?: string | null
}

export async function readFrappeErrorText(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null

    const detail = [
      typeof payload?.message === "string" ? payload.message : "",
      typeof payload?.exception === "string" ? payload.exception : "",
      typeof payload?.exc_type === "string" ? payload.exc_type : "",
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" | ")

    return detail || `HTTP ${response.status}`
  }

  return (await response.text().catch(() => "")).trim() || `HTTP ${response.status}`
}

export function createFrappeConnection(input?: FrappeEnvConfig) {
  const config = input ?? readFrappeEnvConfig()

  if (!config.enabled) {
    throw new Error("FRAPPE_ENABLED must be true before opening a live ERPNext connection.")
  }

  async function request({ path, method = "GET", headers, body }: FrappeRequestInput) {
    const requestHeaders = new Headers(headers)
    requestHeaders.set("authorization", `token ${config.apiKey}:${config.apiSecret}`)
    requestHeaders.set("accept", "application/json")

    if (config.siteName) {
      requestHeaders.set("x-frappe-site-name", config.siteName)
    }

    if (body && !requestHeaders.has("content-type")) {
      requestHeaders.set("content-type", "application/json")
    }

    const startedAt = performance.now()
    const response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body,
      signal: AbortSignal.timeout(config.timeoutSeconds * 1000),
    })

    return {
      response,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    }
  }

  return {
    config,
    request,
  }
}
