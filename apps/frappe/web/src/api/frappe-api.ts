import type {
  FrappeConnectionVerificationResponse,
  FrappeItemManagerResponse,
  FrappeItemProductSyncLogManagerResponse,
  FrappeItemProductSyncPayload,
  FrappeItemProductSyncResponse,
  FrappeItemResponse,
  FrappeItemUpsertPayload,
  FrappePurchaseReceiptManagerResponse,
  FrappePurchaseReceiptResponse,
  FrappePurchaseReceiptSyncPayload,
  FrappePurchaseReceiptSyncResponse,
  FrappeSettingsResponse,
  FrappeSettingsUpdatePayload,
  FrappeTodoListResponse,
  FrappeTodoResponse,
  FrappeTodoUpsertPayload,
} from "@frappe/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

export class HttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const headers = new Headers(init?.headers)

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}.`
    throw new HttpError(message, response.status)
  }

  return (await response.json()) as T
}

export function getFrappeSettings() {
  return request<FrappeSettingsResponse>("/internal/v1/frappe/settings")
}

export function updateFrappeSettings(payload: FrappeSettingsUpdatePayload) {
  return request<FrappeSettingsResponse>("/internal/v1/frappe/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function verifyFrappeConnection(payload: FrappeSettingsUpdatePayload) {
  return request<FrappeConnectionVerificationResponse>(
    "/internal/v1/frappe/settings/verify",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function listFrappeTodos() {
  return request<FrappeTodoListResponse>("/internal/v1/frappe/todos")
}

export function createFrappeTodo(payload: FrappeTodoUpsertPayload) {
  return request<FrappeTodoResponse>("/internal/v1/frappe/todos", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateFrappeTodo(todoId: string, payload: FrappeTodoUpsertPayload) {
  return request<FrappeTodoResponse>(
    `/internal/v1/frappe/todos?id=${encodeURIComponent(todoId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export function listFrappeItems() {
  return request<FrappeItemManagerResponse>("/internal/v1/frappe/items")
}

export function getFrappeItem(itemId: string) {
  return request<FrappeItemResponse>(
    `/internal/v1/frappe/item?id=${encodeURIComponent(itemId)}`
  )
}

export function createFrappeItem(payload: FrappeItemUpsertPayload) {
  return request<FrappeItemResponse>("/internal/v1/frappe/items", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateFrappeItem(itemId: string, payload: FrappeItemUpsertPayload) {
  return request<FrappeItemResponse>(
    `/internal/v1/frappe/item?id=${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export function listFrappeItemSyncLogs() {
  return request<FrappeItemProductSyncLogManagerResponse>(
    "/internal/v1/frappe/items/sync-logs"
  )
}

export function syncFrappeItemsToProducts(payload: FrappeItemProductSyncPayload) {
  return request<FrappeItemProductSyncResponse>(
    "/internal/v1/frappe/items/sync-products",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function listFrappePurchaseReceipts() {
  return request<FrappePurchaseReceiptManagerResponse>(
    "/internal/v1/frappe/purchase-receipts"
  )
}

export function getFrappePurchaseReceipt(receiptId: string) {
  return request<FrappePurchaseReceiptResponse>(
    `/internal/v1/frappe/purchase-receipt?id=${encodeURIComponent(receiptId)}`
  )
}

export function syncFrappePurchaseReceipts(payload: FrappePurchaseReceiptSyncPayload) {
  return request<FrappePurchaseReceiptSyncResponse>(
    "/internal/v1/frappe/purchase-receipts/sync",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}
