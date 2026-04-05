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

test("framework media service stores folders, uploads assets, and serves content", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-framework-media-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

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

      assert.equal(listedFolders.items.length, 1)
      assert.equal(listedMedia.items.length, 1)
      assert.equal(listedMedia.items[0]?.folderName, "Company Logos")
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
    config.offline.enabled = false

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
