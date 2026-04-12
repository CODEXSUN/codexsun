import type {
  FrappeConnectionVerification,
  FrappeSettings,
  FrappeSettingsUpdatePayload,
} from "@frappe/shared"

import {
  getFrappeSettings,
  updateFrappeSettings,
  verifyFrappeConnection,
} from "../api/frappe-api"

export type FrappeConnectionUiState = "connected" | "failed" | "verifying"

function toStatusState(settings: FrappeSettings): FrappeConnectionUiState {
  return settings.lastVerificationStatus === "passed" ? "connected" : "failed"
}

export async function getConnectionStatus() {
  const response = await getFrappeSettings()

  return {
    settings: response.settings,
    state: toStatusState(response.settings),
    user: response.settings.lastVerifiedUser || null,
    latencyMs: response.settings.lastVerifiedLatencyMs,
    error:
      response.settings.lastVerificationStatus === "failed"
        ? response.settings.lastVerificationDetail ||
          response.settings.lastVerificationMessage
        : null,
  }
}

export async function triggerVerification() {
  const response = await verifyFrappeConnection()
  const verification = response.verification
  const state: FrappeConnectionUiState =
    verification.status === "success" ? "connected" : "failed"

  return {
    verification,
    state,
    user: verification.user || null,
    latencyMs: verification.latencyMs,
    error: verification.error,
  }
}

export async function saveConnectionSettings(payload: FrappeSettingsUpdatePayload) {
  const response = await updateFrappeSettings(payload)

  return {
    settings: response.settings,
    state: toStatusState(response.settings),
  }
}

export function toVerificationBadge(
  state: FrappeConnectionUiState,
  verification: FrappeConnectionVerification | null
) {
  if (state === "verifying") {
    return "Verifying \u23F3"
  }

  if (state === "connected" && verification?.status === "success") {
    return "Connected \u2705"
  }

  return "Failed \u274C"
}
