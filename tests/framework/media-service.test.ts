import assert from "node:assert/strict"
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createMediaFolder,
  getMedia,
  listMedia,
  listMediaFolders,
  readMediaContent,
  toggleMediaActive,
  updateMedia,
  uploadMediaImage,
} from "../../apps/framework/src/runtime/media/media-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import {
  ensurePublicMediaSymlink,
  publicMediaMountDirectory,
} from "../../apps/framework/src/runtime/media/media-storage.js"

function disableOfflineIfPresent(config: Record<string, unknown>) {
  const offline = config.offline as { enabled?: boolean } | undefined

  if (offline) {
    offline.enabled = false
  }
}

function disableCxmediaIfPresent(config: Record<string, unknown>) {
  const media = config.media as
    | {
        cxmedia?: {
          enabled?: boolean
          baseUrl?: string
          email?: string
          password?: string
        }
      }
    | undefined

  if (media?.cxmedia) {
    media.cxmedia.enabled = false
    media.cxmedia.baseUrl = ""
    media.cxmedia.email = ""
    media.cxmedia.password = ""
  }
}

test("framework media service stores folders, uploads assets, and serves content", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-framework-media-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    disableOfflineIfPresent(config as unknown as Record<string, unknown>)
    disableCxmediaIfPresent(config as unknown as Record<string, unknown>)

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const folder = await createMediaFolder(runtime.primary, {
        name: "Company Logos",
        parentId: null,
        isActive: true,
      })

      assert.equal(folder.item.name, "Company Logos")

      const uploaded = await uploadMediaImage(runtime.primary, config, {
        fileName: "company-logo",
        originalName: "company-logo.png",
        dataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8XQAAAAASUVORK5CYII=",
        folderId: folder.item.id,
        storageScope: "public",
        title: "Company Logo",
        altText: "Company Logo",
        description: "Primary logo asset.",
        tags: ["logo", "company"],
        isActive: true,
      })

      assert.equal(uploaded.item.title, "Company Logo")
      assert.equal(uploaded.item.storageScope, "public")
      assert.match(uploaded.item.fileUrl, /^\/storage\//)

      const publicMediaPath = path.join(
        publicMediaMountDirectory(config),
        uploaded.item.backendKey
      )

      assert.equal(existsSync(publicMediaPath), true)

      const listedFolders = await listMediaFolders(runtime.primary)
      const listedMedia = await listMedia(runtime.primary)
      const fetchedMedia = await getMedia(runtime.primary, uploaded.item.id)
      const servedContent = await readMediaContent(runtime.primary, config, uploaded.item.id)

      assert.ok(listedFolders.items.some((item) => item.id === folder.item.id))
      assert.ok(listedMedia.items.some((item) => item.id === uploaded.item.id))
      assert.equal(
        listedMedia.items.find((item) => item.id === uploaded.item.id)?.folderName,
        "Company Logos"
      )
      assert.equal(fetchedMedia.item.id, uploaded.item.id)
      assert.equal(servedContent.item.mimeType, "image/png")
      assert.equal(servedContent.content.byteLength > 0, true)
      assert.deepEqual(readFileSync(publicMediaPath), servedContent.content)

      const madePrivate = await updateMedia(runtime.primary, config, uploaded.item.id, {
        title: "Company Logo",
        altText: "Company Logo",
        description: "Primary logo asset.",
        folderId: folder.item.id,
        storageScope: "private",
        tags: ["logo", "company"],
        isActive: true,
      })

      assert.equal(madePrivate.item.storageScope, "private")
      assert.match(madePrivate.item.fileUrl, /\/internal\/v1\/framework\/media-file\?id=/)
      assert.equal(existsSync(publicMediaPath), false)

      const deactivated = await toggleMediaActive(runtime.primary, uploaded.item.id, false)
      assert.equal(deactivated.item.isActive, false)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("framework media symlink setup replaces the generated placeholder storage directory", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-framework-media-link-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    disableOfflineIfPresent(config as unknown as Record<string, unknown>)
    disableCxmediaIfPresent(config as unknown as Record<string, unknown>)

    const mountDirectory = publicMediaMountDirectory(config)
    const legacyMountDirectory = path.join(config.webRoot, "public", "media")
    const placeholderDirectory = path.join(mountDirectory, "placeholders")

    rmSync(mountDirectory, { recursive: true, force: true })
    rmSync(legacyMountDirectory, { recursive: true, force: true })
    mkdirSync(placeholderDirectory, { recursive: true })
    mkdirSync(path.join(legacyMountDirectory, "placeholders"), { recursive: true })
    writeFileSync(
      path.join(placeholderDirectory, "default.txt"),
      "generated placeholder"
    )
    writeFileSync(
      path.join(legacyMountDirectory, "placeholders", "default.txt"),
      "generated placeholder"
    )

    await ensurePublicMediaSymlink(config)

    assert.equal(existsSync(path.join(mountDirectory, "placeholders")), false)
    assert.equal(lstatSync(mountDirectory).isSymbolicLink(), true)
    assert.equal(existsSync(legacyMountDirectory), false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("framework media service can store binaries in cxmedia while keeping framework metadata local", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-framework-media-cxmedia-"))
  const originalFetch = global.fetch
  const storedObjects = new Map<
    string,
    {
      body: Buffer
      contentType: string
    }
  >()

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url

    if (url === "http://cxmedia.local/api/auth/login") {
      return new Response(
        JSON.stringify({
          accessToken: "cxmedia-token",
          expiresInSeconds: 3600,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    }

    if (url === "http://cxmedia.local/api/upload") {
      const formData = init?.body as FormData
      const uploadedFile = formData.get("file")

      if (!(uploadedFile instanceof File)) {
        throw new Error("Expected cxmedia upload file.")
      }

      const buffer = Buffer.from(await uploadedFile.arrayBuffer())
      const objectPath = "framework-media/mock-upload.png"
      storedObjects.set(objectPath, {
        body: buffer,
        contentType: uploadedFile.type || "application/octet-stream",
      })

      return new Response(
        JSON.stringify({
          item: {
            byteSize: buffer.byteLength,
            contentType: uploadedFile.type || "application/octet-stream",
            createdAt: new Date().toISOString(),
            path: objectPath,
            privateUrl: `http://cxmedia.local/api/file/${objectPath}`,
            publicUrl: `http://cxmedia.local/f/${objectPath}`,
            transformUrls: {
              crop: `http://cxmedia.local/crop/300x300/${objectPath}`,
              resize: `http://cxmedia.local/resize/300x300/${objectPath}`,
            },
            visibility: "private",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    }

    if (url === "http://cxmedia.local/api/file/framework-media/mock-upload.png") {
      const stored = storedObjects.get("framework-media/mock-upload.png")

      return new Response(stored?.body ?? Buffer.alloc(0), {
        status: stored ? 200 : 404,
        headers: {
          "content-type": stored?.contentType || "application/octet-stream",
        },
      })
    }

    throw new Error(`Unexpected fetch call: ${url}`)
  }) as typeof fetch

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    disableOfflineIfPresent(config as unknown as Record<string, unknown>)
    config.media.cxmedia.enabled = true
    config.media.cxmedia.baseUrl = "http://cxmedia.local"
    config.media.cxmedia.email = "admin@example.com"
    config.media.cxmedia.password = "change-me-now"

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const uploaded = await uploadMediaImage(runtime.primary, config, {
        fileName: "company-logo",
        originalName: "company-logo.png",
        dataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8XQAAAAASUVORK5CYII=",
        folderId: null,
        storageScope: "public",
        title: "Company Logo",
        altText: "Company Logo",
        description: null,
        tags: ["logo"],
        isActive: true,
      })

      assert.equal(uploaded.item.provider, "cdn")
      assert.equal(uploaded.item.backendKey, "framework-media/mock-upload.png")
      assert.match(uploaded.item.fileUrl, /\/public\/v1\/framework\/media-file\?id=/)

      const served = await readMediaContent(runtime.primary, config, uploaded.item.id)
      assert.equal(served.item.backendKey, "framework-media/mock-upload.png")
      assert.equal(served.content.byteLength > 0, true)

      const listed = await listMedia(runtime.primary)
      assert.ok(listed.items.some((item) => item.id === uploaded.item.id))
      assert.equal(
        listed.items.find((item) => item.id === uploaded.item.id)?.provider,
        "cdn"
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    global.fetch = originalFetch
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
