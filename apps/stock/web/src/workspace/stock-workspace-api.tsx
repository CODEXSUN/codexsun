import { useEffect, useState } from "react"

import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { formatHttpErrorMessage } from "@cxapp/web/src/lib/http-error"

import type { ResourceState } from "./stock-workspace-types"

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string; detail?: string }
      | null
    throw new Error(formatHttpErrorMessage(payload, response.status))
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

export function useJsonResource<T>(path: string, deps: readonly unknown[] = []) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: Boolean(path),
  })
  const dependencyKey = JSON.stringify(deps)

  useEffect(() => {
    if (!path) {
      return
    }

    let cancelled = false

    async function load() {
      setState({ data: null, error: null, isLoading: true })

      try {
        const data = await requestJson<T>(path)
        if (!cancelled) {
          setState({ data, error: null, isLoading: false })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "Request failed.",
            isLoading: false,
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [dependencyKey, path])

  return path ? state : { data: null, error: null, isLoading: false }
}

export function createTransferForm() {
  return {
    id: `transfer:${Date.now()}`,
    status: "requested",
    sourceWarehouseId: "",
    sourceLocationId: "",
    destinationWarehouseId: "",
    destinationLocationId: "",
    requestedAt: new Date().toISOString(),
    dispatchedAt: "",
    receivedAt: "",
    referenceType: "manual_transfer",
    referenceId: "",
    notes: "",
    productId: "",
    quantity: "1",
  }
}

export function createReservationForm() {
  return {
    id: `reservation:${Date.now()}`,
    warehouseId: "",
    locationId: "",
    productId: "",
    referenceType: "pre_sale",
    referenceId: "",
    quantity: "1",
    consumedQuantity: "0",
    status: "active",
    reservedAt: new Date().toISOString(),
    expiresAt: "",
    releasedAt: "",
    notes: "",
  }
}
