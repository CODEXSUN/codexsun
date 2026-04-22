import path from "node:path"

function normalizeSegment(value: string) {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/")
}

export function sanitizeObjectPath(value: string) {
  const normalized = normalizeSegment(value)

  if (!normalized) {
    throw new Error("Object path is required.")
  }

  if (normalized.includes("..")) {
    throw new Error("Object path cannot include '..'.")
  }

  return normalized
}

export function sanitizePrefix(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  const normalized = normalizeSegment(value)

  if (!normalized) {
    return ""
  }

  if (normalized.includes("..")) {
    throw new Error("Prefix cannot include '..'.")
  }

  return normalized.endsWith("/") ? normalized : `${normalized}/`
}

export function slugifyFileName(value: string) {
  const originalExtension = path.extname(value)
  const extension = originalExtension.toLowerCase()
  const baseName = path.basename(value, originalExtension)
  const slugBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

  return `${slugBase || "image"}${extension}`
}
