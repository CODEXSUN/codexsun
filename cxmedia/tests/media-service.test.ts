import assert from "node:assert/strict"
import test from "node:test"

import { MediaService } from "../src/media/service.js"
import { RuntimeSettingsService } from "../src/settings/service.js"

import {
  InMemoryS3Client,
  createAdminActor,
  createTestConfig,
} from "./test-fixtures.js"

async function withMockedDateNow<T>(value: number, run: () => Promise<T> | T): Promise<T> {
  const original = Date.now
  Date.now = () => value

  try {
    return await run()
  } finally {
    Date.now = original
  }
}

test("media service uploads objects with sanitized prefixes and preserves metadata", async () => {
  const storage = new InMemoryS3Client()
  const config = createTestConfig()
  const runtimeSettings = new RuntimeSettingsService(config)
  await runtimeSettings.initialize()
  const mediaService = new MediaService(config, storage as never, runtimeSettings)

  const result = await withMockedDateNow(1_700_000_000_000, () =>
    mediaService.uploadObject({
      actor: createAdminActor(),
      buffer: Buffer.from("png-bytes"),
      contentType: "image/png",
      originalName: "Hero Banner.PNG",
      prefix: "\\marketing\\campaign one",
      visibility: "public",
    })
  )

  assert.match(result.item.path, /^marketing\/campaign one\/1700000000000-[a-f0-9]{8}\.png$/)
  assert.equal(result.item.visibility, "public")
  assert.equal(result.item.contentType, "image/png")
  assert.equal(result.item.byteSize, Buffer.byteLength("png-bytes"))
  assert.equal(result.cdnUrl, result.item.publicUrl)
  assert.equal(
    result.item.publicUrl,
    `http://cdn.local/f/${result.item.path.split("/").map(encodeURIComponent).join("/")}`
  )

  const stored = await storage.getObject(result.item.path)

  assert.equal(stored.metadata.original_name, "Hero Banner.PNG")
  assert.equal(stored.metadata.uploaded_by, "admin@example.com")
  assert.equal(stored.metadata.visibility, "public")
  assert.deepEqual(stored.body, Buffer.from("png-bytes"))
})

test("media service creates and verifies signed upload and download urls", async () => {
  const config = createTestConfig({
    publicBaseUrl: "http://media.local",
    signedUrls: {
      secret: "signed-secret-123456",
      expiresInSeconds: 120,
    },
  })
  const runtimeSettings = new RuntimeSettingsService(config)
  await runtimeSettings.initialize()
  const mediaService = new MediaService(config, new InMemoryS3Client() as never, runtimeSettings)

  const downloadSigned = await withMockedDateNow(1_700_000_000_000, () =>
    mediaService.createSignedUrl({
      action: "download",
      objectPath: "/private/gallery/photo 1.png",
    })
  )
  const uploadSigned = await withMockedDateNow(1_700_000_000_000, () =>
    mediaService.createSignedUrl({
      action: "upload",
      objectPath: "incoming/photo.png",
      expiresInSeconds: 30,
    })
  )

  assert.match(
    downloadSigned.url,
    /^http:\/\/media\.local\/p\/private\/gallery\/photo%201\.png\?token=/
  )
  assert.match(uploadSigned.url, /^http:\/\/media\.local\/signed-upload\/incoming\/photo\.png\?token=/)

  const verifiedDownload = await withMockedDateNow(1_700_000_050_000, () =>
    mediaService.verifySignedUrl(downloadSigned.token, "download", "private/gallery/photo 1.png")
  )

  assert.equal(verifiedDownload.action, "download")
  assert.equal(verifiedDownload.path, "private/gallery/photo 1.png")

  assert.throws(
    () => mediaService.verifySignedUrl(downloadSigned.token, "upload", "private/gallery/photo 1.png"),
    {
      message: "Signed URL action is invalid.",
    }
  )
  assert.throws(
    () => mediaService.verifySignedUrl(downloadSigned.token, "download", "private/gallery/other.png"),
    {
      message: "Signed URL path is invalid.",
    }
  )
  await assert.rejects(
    () =>
      withMockedDateNow(1_700_000_200_000, () =>
        mediaService.verifySignedUrl(uploadSigned.token, "upload", "incoming/photo.png")
      ),
    {
      message: "Signed URL has expired.",
    }
  )
})

test("media service rejects unsupported upload mime types", async () => {
  const config = createTestConfig()
  const runtimeSettings = new RuntimeSettingsService(config)
  await runtimeSettings.initialize()
  const mediaService = new MediaService(config, new InMemoryS3Client() as never, runtimeSettings)

  await assert.rejects(
    () =>
      mediaService.uploadObject({
        actor: createAdminActor(),
        buffer: Buffer.from("gif-bytes"),
        contentType: "image/gif",
        originalName: "animated.gif",
        visibility: "private",
      }),
    {
      message: "Unsupported media type: image/gif",
    }
  )
})
