import { lstat, mkdir, readdir, realpath, rename, rm, symlink } from "node:fs/promises"
import path from "node:path"

import type { ServerConfig } from "../config/index.js"
import { mediaSymlinkStatusSchema, type MediaSymlinkStatus } from "../../../shared/media.js"

export function mediaRootDirectory(config: ServerConfig) {
  return path.resolve(config.webRoot, "..", "..", "..", "..", "storage", "media")
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

export function publicMediaFileUrl(backendKey: string) {
  return `/storage/${backendKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`
}

export async function inspectPublicMediaSymlink(
  config: ServerConfig
): Promise<MediaSymlinkStatus> {
  const mountPath = publicMediaMountDirectory(config)
  const targetPath = mediaVisibilityDirectory(config, "public")

  try {
    const existing = await lstat(mountPath)

    if (!existing.isSymbolicLink()) {
      return mediaSymlinkStatusSchema.parse({
        mountPath,
        targetPath,
        resolvedTargetPath: null,
        exists: true,
        isSymbolicLink: false,
        status: "misconfigured",
        detail: "Public media mount exists but is not a symlink.",
      })
    }

    const [resolvedMountPath, resolvedTargetPath] = await Promise.all([
      realpath(mountPath),
      realpath(targetPath).catch(() => path.resolve(targetPath)),
    ])
    const isHealthy = resolvedMountPath === resolvedTargetPath

    return mediaSymlinkStatusSchema.parse({
      mountPath,
      targetPath,
      resolvedTargetPath: resolvedMountPath,
      exists: true,
      isSymbolicLink: true,
      status: isHealthy ? "healthy" : "misconfigured",
      detail: isHealthy
        ? "Public media symlink is healthy."
        : "Public media symlink exists but points to a different target.",
    })
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code === "ENOENT") {
      return mediaSymlinkStatusSchema.parse({
        mountPath,
        targetPath,
        resolvedTargetPath: null,
        exists: false,
        isSymbolicLink: false,
        status: "missing",
        detail: "Public media symlink is missing.",
      })
    }

    throw error
  }
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

async function removeMountDirectoryIfPresent(linkDirectory: string) {
  try {
    const existing = await lstat(linkDirectory)

    if (existing.isSymbolicLink()) {
      await rm(linkDirectory, { recursive: true, force: true })
      return
    }

    if (existing.isDirectory() && (await canReplaceExistingMountDirectory(linkDirectory))) {
      await rm(linkDirectory, { recursive: true, force: true })
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code

    if (code !== "ENOENT") {
      throw error
    }
  }
}

export async function ensurePublicMediaSymlink(config: ServerConfig) {
  const targetDirectory = mediaVisibilityDirectory(config, "public")
  await removeMountDirectoryIfPresent(path.join(config.webRoot, "public", "media"))
  await ensureSymlink(targetDirectory, publicMediaMountDirectory(config))
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
  const linkDirectories = [publicMediaMountDirectory(config)]

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
