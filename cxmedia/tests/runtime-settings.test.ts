import assert from "node:assert/strict"
import test from "node:test"

import { RuntimeSettingsService } from "../src/settings/service.js"

import { createTestConfig } from "./test-fixtures.js"

test("runtime settings service persists admin-editable standalone settings", async () => {
  const service = new RuntimeSettingsService(createTestConfig())

  await service.initialize()
  await service.updateRuntimeSettings({
    allowedMimeTypes: ["image/png", "image/webp", "image/png"],
    defaultUploadVisibility: "private",
    signedUrlExpiresInSeconds: 120,
  })

  const settings = await service.getRuntimeSettings()

  assert.deepEqual(settings.allowedMimeTypes, ["image/png", "image/webp"])
  assert.equal(settings.defaultUploadVisibility, "private")
  assert.equal(settings.signedUrlExpiresInSeconds, 120)
})
