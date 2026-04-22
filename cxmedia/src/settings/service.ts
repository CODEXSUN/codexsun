import type { CxmediaConfig } from "../config/env.js"
import { readJsonFile, writeJsonFile } from "../persistence/json-file.js"

import type { MediaVisibility } from "../media/contracts.js"

type RuntimeSettingsState = {
  allowedMimeTypes: string[]
  defaultUploadVisibility: MediaVisibility
  signedUrlExpiresInSeconds: number
}

function normalizeMimeTypes(values: string[]) {
  const nextValues = values.map((value) => value.trim()).filter(Boolean)

  if (nextValues.length === 0) {
    throw new Error("At least one allowed mime type is required.")
  }

  return [...new Set(nextValues)].sort((left, right) => left.localeCompare(right))
}

export class RuntimeSettingsService {
  constructor(private readonly config: CxmediaConfig) {}

  async initialize() {
    const current = await this.readState()
    await this.writeState(current)
  }

  async getRuntimeSettings() {
    return this.readState()
  }

  async updateRuntimeSettings(input: Partial<RuntimeSettingsState>) {
    const current = await this.readState()
    const nextState: RuntimeSettingsState = {
      allowedMimeTypes: input.allowedMimeTypes
        ? normalizeMimeTypes(input.allowedMimeTypes)
        : current.allowedMimeTypes,
      defaultUploadVisibility: input.defaultUploadVisibility ?? current.defaultUploadVisibility,
      signedUrlExpiresInSeconds:
        input.signedUrlExpiresInSeconds ?? current.signedUrlExpiresInSeconds,
    }

    if (nextState.signedUrlExpiresInSeconds <= 0) {
      throw new Error("Signed URL expiry must be greater than zero.")
    }

    await this.writeState(nextState)
    return nextState
  }

  async getSettingsPayload() {
    const runtime = await this.readState()

    return {
      allowedMimeTypes: runtime.allowedMimeTypes,
      appName: this.config.appName,
      cdnBaseUrl: this.config.cdnBaseUrl,
      defaultUploadVisibility: runtime.defaultUploadVisibility,
      publicBaseUrl: this.config.publicBaseUrl,
      signedUrlExpiresInSeconds: runtime.signedUrlExpiresInSeconds,
      storage: {
        bucket: this.config.storage.bucket,
        endpoint: this.config.storage.endpoint,
        region: this.config.storage.region,
      },
      thumborEnabled: Boolean(this.config.thumborInternalBaseUrl),
    }
  }

  private async readState() {
    return readJsonFile<RuntimeSettingsState>(this.config.runtimeSettings.filePath, {
      allowedMimeTypes: [...this.config.allowedMimeTypes],
      defaultUploadVisibility: "public",
      signedUrlExpiresInSeconds: this.config.signedUrls.expiresInSeconds,
    })
  }

  private async writeState(state: RuntimeSettingsState) {
    await writeJsonFile(this.config.runtimeSettings.filePath, {
      allowedMimeTypes: normalizeMimeTypes(state.allowedMimeTypes),
      defaultUploadVisibility: state.defaultUploadVisibility,
      signedUrlExpiresInSeconds: state.signedUrlExpiresInSeconds,
    })
  }
}
