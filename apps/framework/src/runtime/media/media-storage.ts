import { lstat, mkdir, rename, rm, symlink } from "node:fs/promises"
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
  return path.join(config.webRoot, "public", "media")
}

export function publicMediaFileUrl(backendKey: string) {
  return `/public/media/${backendKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`
}

export async function ensurePublicMediaSymlink(config: ServerConfig) {
  const targetDirectory = mediaVisibilityDirectory(config, "public")
  const linkDirectory = publicMediaMountDirectory(config)
  const parentDirectory = path.dirname(linkDirectory)

  await mkdir(targetDirectory, { recursive: true })
  await mkdir(parentDirectory, { recursive: true })

  try {
    const existing = await lstat(linkDirectory)

    if (existing.isSymbolicLink()) {
      return
    }

    throw new Error(
      `Public media mount already exists and is not a symlink: ${linkDirectory}`
    )
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
  const linkDirectory = publicMediaMountDirectory(config)

  try {
    const existing = await lstat(linkDirectory)

    if (!existing.isSymbolicLink()) {
      return
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code === "ENOENT") {
      return
    }

    throw error
  }

  await rm(linkDirectory, { recursive: true, force: true })
}
