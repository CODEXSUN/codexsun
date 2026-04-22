import type { FolderNode, MediaItem } from "./types"

export function formatBytes(value: number | null) {
  if (!value) {
    return "Unknown"
  }

  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never"
}

export function mediaName(path: string) {
  return path.split("/").at(-1) || path
}

export function pathPrefix(path: string) {
  const segments = path.split("/")
  return segments.length > 1 ? segments.slice(0, -1).join("/") : ""
}

export function parentPrefix(prefix: string) {
  if (!prefix.includes("/")) {
    return ""
  }

  return prefix.slice(0, prefix.lastIndexOf("/"))
}

export function previewUrl(item: MediaItem) {
  if (item.visibility === "public") {
    return item.publicUrl
  }

  return `/api/file/${item.path.split("/").map(encodeURIComponent).join("/")}`
}

export function buildFolderTree(items: MediaItem[]) {
  const index = new Map<string, FolderNode>()

  for (const item of items) {
    const segments = item.path.split("/").slice(0, -1)
    let parentPath = ""

    for (const segment of segments) {
      parentPath = parentPath ? `${parentPath}/${segment}` : segment

      if (!index.has(parentPath)) {
        index.set(parentPath, {
          name: segment,
          path: parentPath,
          children: [],
        })
      }
    }
  }

  const roots = new Map<string, FolderNode>()

  for (const node of index.values()) {
    const nextParentPath = node.path.includes("/") ? node.path.slice(0, node.path.lastIndexOf("/")) : ""

    if (!nextParentPath) {
      roots.set(node.path, node)
      continue
    }

    const parent = index.get(nextParentPath)

    if (parent && !parent.children.some((child) => child.path === node.path)) {
      parent.children.push(node)
    }
  }

  const sortNodes = (nodes: FolderNode[]): FolderNode[] =>
    [...nodes]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }))

  return sortNodes([...roots.values()])
}
