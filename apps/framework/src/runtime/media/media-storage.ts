import { lstat, mkdir, readdir, rename, rm, symlink } from "node:fs/promises"
import path from "node:path"

import type { ServerConfig } from "../config/index.js"

export function mediaRootDirectory(config: ServerConfig) {
  return path.resolve(path.dirname(config.database.sqliteFile), "..", "media")
}

export function mediaVisibilityDirectory(
  config: ServerConfig,
  scope: "public" | "private"
) {
  return path.join(mediaRootDirectory(config), scope)
}

export function mediaAbsolutePath(
  config: ServerConfig,
  scope: "public" | "private",
  backendKey: string
) {
  return path.join(mediaVisibilityDirectory(config, scope), backendKey)
}

export function publicMediaMountDirectory(config: ServerConfig) {
  return path.join(config.webRoot, "storage")
}

export function legacyPublicMediaMountDirectory(config: ServerConfig) {
  return path.join(config.webRoot, "public", "media")
}

export function publicMediaFileUrl(backendKey: string) {
  return `/storage/${backendKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`
}

async function canReplaceExistingMountDirectory(linkDirectory: string) {
  const entries = await readdir(linkDirectory, { withFileTypes: true })

  if (entries.length === 0) {
    return true
  }

  if (entries.length !== 1) {
    return false
  }

  const placeholderDirectory = entries[0]

  if (!placeholderDirectory?.isDirectory() || placeholderDirectory.name !== "placeholders") {
    return false
  }

  const placeholderEntries = await readdir(path.join(linkDirectory, "placeholders"), {
    withFileTypes: true,
  })

  return (
    placeholderEntries.length === 1 &&
    placeholderEntries[0]?.isFile() === true &&
    placeholderEntries[0].name === "default.txt"
  )
}

async function ensureSymlink(targetDirectory: string, linkDirectory: string) {
  const parentDirectory = path.dirname(linkDirectory)

  await mkdir(targetDirectory, { recursive: true })
  await mkdir(parentDirectory, { recursive: true })

  try {
    const existing = await lstat(linkDirectory)

    if (existing.isSymbolicLink()) {
      return
    }

    if (existing.isDirectory() && (await canReplaceExistingMountDirectory(linkDirectory))) {
      await rm(linkDirectory, { recursive: true, force: true })
    } else {
      throw new Error(
        `Public media mount already exists and is not a symlink: ${linkDirectory}`
      )
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code !== "ENOENT") {
      throw error
    }
  }

  await symlink(
    targetDirectory,
    linkDirectory,
    process.platform === "win32" ? "junction" : "dir"
  )
}

export async function ensurePublicMediaSymlink(config: ServerConfig) {
  const targetDirectory = mediaVisibilityDirectory(config, "public")
  await ensureSymlink(targetDirectory, publicMediaMountDirectory(config))
  await ensureSymlink(targetDirectory, legacyPublicMediaMountDirectory(config))
}

export async function moveMediaBinaryBetweenScopes(
  config: ServerConfig,
  backendKey: string,
  fromScope: "public" | "private",
  toScope: "public" | "private"
) {
  if (fromScope === toScope) {
    return
  }

  const sourcePath = mediaAbsolutePath(config, fromScope, backendKey)
  const targetPath = mediaAbsolutePath(config, toScope, backendKey)

  await mkdir(path.dirname(targetPath), { recursive: true })

  try {
    await rename(sourcePath, targetPath)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code === "ENOENT") {
      return
    }

    throw error
  }

  if (fromScope === "public" || toScope === "public") {
    await ensurePublicMediaSymlink(config)
  }
}

export async function removePublicMediaSymlink(config: ServerConfig) {
  const linkDirectories = [
    publicMediaMountDirectory(config),
    legacyPublicMediaMountDirectory(config),
  ]

  for (const linkDirectory of linkDirectories) {
    try {
      const existing = await lstat(linkDirectory)

      if (!existing.isSymbolicLink()) {
        continue
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code

      if (code === "ENOENT") {
        continue
      }

      throw error
    }

    await rm(linkDirectory, { recursive: true, force: true })
  }
}
