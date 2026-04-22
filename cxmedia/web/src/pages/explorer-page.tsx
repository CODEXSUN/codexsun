import { useMemo, useRef } from "react"

import { createSignedUrl, deleteFile, uploadFile } from "../api"
import type { ExplorerView, FolderNode, MediaItem } from "../types"
import { buildFolderTree, formatBytes, formatDate, mediaName, parentPrefix, pathPrefix, previewUrl } from "../utils"

function FolderTreeNode({
  currentPrefix,
  node,
  onSelect,
}: {
  currentPrefix: string
  node: FolderNode
  onSelect: (prefix: string) => void
}) {
  const isActive = currentPrefix === node.path

  return (
    <div className="folder-node">
      <button className="tree-button" data-active={isActive} onClick={() => onSelect(node.path)} type="button">
        <span className="tree-caret">{node.children.length > 0 ? "▸" : "•"}</span>
        <span>{node.name}</span>
      </button>
      {node.children.length > 0 ? (
        <div className="folder-node-children">
          {node.children.map((child) => (
            <FolderTreeNode key={child.path} currentPrefix={currentPrefix} node={child} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function ExplorerPage({
  canUpload,
  currentPrefix,
  isLoading,
  isUploading,
  items,
  search,
  selectedItem,
  setCurrentPrefix,
  setSearch,
  setSelectedPath,
  setStatus,
  setError,
  setIsUploading,
  uploadPrefix,
  setUploadPrefix,
  uploadVisibility,
  setUploadVisibility,
  view,
  setView,
  onRefresh,
}: {
  canUpload: boolean
  currentPrefix: string
  isLoading: boolean
  isUploading: boolean
  items: MediaItem[]
  search: string
  selectedItem: MediaItem | null
  setCurrentPrefix: (prefix: string) => void
  setSearch: (value: string) => void
  setSelectedPath: (path: string | null) => void
  setStatus: (value: string) => void
  setError: (value: string) => void
  setIsUploading: (value: boolean) => void
  uploadPrefix: string
  setUploadPrefix: (value: string) => void
  uploadVisibility: "public" | "private"
  setUploadVisibility: (value: "public" | "private") => void
  view: ExplorerView
  setView: (value: ExplorerView) => void
  onRefresh: () => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const tree = useMemo(() => buildFolderTree(items), [items])
  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items
      .filter((item) => pathPrefix(item.path) === currentPrefix)
      .filter((item) =>
        normalizedSearch
          ? `${item.path} ${item.contentType} ${item.visibility}`.toLowerCase().includes(normalizedSearch)
          : true
      )
      .sort((left, right) => left.path.localeCompare(right.path))
  }, [currentPrefix, items, search])

  async function handleUpload(fileList: FileList | null) {
    const file = fileList?.[0]

    if (!file) {
      return
    }

    setError("")
    setStatus(`Uploading ${file.name}...`)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("prefix", uploadPrefix.trim() || currentPrefix)
      formData.set("visibility", uploadVisibility)

      const response = await uploadFile(formData)
      setStatus(`Uploaded ${response.item.path}.`)
      setSelectedPath(response.item.path)
      await onRefresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed.")
      setStatus("")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setIsUploading(false)
    }
  }

  async function handleDelete(path: string) {
    setError("")

    try {
      await deleteFile(path)
      setStatus(`Deleted ${path}.`)
      setSelectedPath(null)
      await onRefresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Delete failed.")
    }
  }

  async function handleCopySignedUrl(path: string) {
    try {
      const response = await createSignedUrl(path)
      await navigator.clipboard.writeText(response.url)
      setStatus("Signed URL copied.")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate signed URL.")
    }
  }

  return (
    <div className="explorer-shell">
      <aside className="explorer-tree">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Folders</p>
            <h2>Tree</h2>
          </div>
          <button className="ghost-button" onClick={() => setCurrentPrefix("")} type="button">
            Root
          </button>
        </div>
        <div className="tree-scroll">
          {tree.length === 0 ? (
            <div className="placeholder-panel">No folders yet.</div>
          ) : (
            tree.map((node) => (
              <FolderTreeNode key={node.path} currentPrefix={currentPrefix} node={node} onSelect={setCurrentPrefix} />
            ))
          )}
        </div>
      </aside>

      <section className="explorer-workspace">
        <header className="workspace-topbar">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>{currentPrefix || "Library"}</h1>
            <p className="workspace-path">{currentPrefix || "Root directory"}</p>
          </div>
          <div className="workspace-actions">
            <button className="ghost-button" disabled={!currentPrefix} onClick={() => setCurrentPrefix(parentPrefix(currentPrefix))} type="button">
              Up
            </button>
            <button className="ghost-button" onClick={() => setView(view === "tiles" ? "list" : "tiles")} type="button">
              {view === "tiles" ? "List" : "Tiles"}
            </button>
            <button className="primary-button" disabled={isLoading} onClick={() => void onRefresh()} type="button">
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="workspace-toolbar">
          <label className="field-block">
            <span>Search</span>
            <input placeholder="Search current folder" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label className="field-block">
            <span>Upload Folder</span>
            <input
              disabled={!canUpload}
              placeholder={currentPrefix || "folder/subfolder"}
              value={uploadPrefix}
              onChange={(event) => setUploadPrefix(event.target.value)}
            />
          </label>
          <label className="field-block short-field">
            <span>Visibility</span>
            <select
              disabled={!canUpload}
              value={uploadVisibility}
              onChange={(event) => setUploadVisibility(event.target.value as "public" | "private")}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="upload-button" data-disabled={!canUpload || isUploading}>
            <input
              ref={fileInputRef}
              accept="image/*"
              disabled={!canUpload || isUploading}
              type="file"
              onChange={(event) => void handleUpload(event.target.files)}
            />
            <span>{isUploading ? "Uploading..." : "Upload File"}</span>
          </label>
        </section>

        <section className={view === "tiles" ? "file-grid" : "file-list"}>
          {visibleItems.length === 0 ? (
            <div className="placeholder-panel large-placeholder">No files in this folder.</div>
          ) : (
            visibleItems.map((item) => (
              <button
                key={item.path}
                className="file-row"
                data-selected={selectedItem?.path === item.path}
                onClick={() => setSelectedPath(item.path)}
                type="button"
              >
                <div className="file-preview">
                  <img alt={mediaName(item.path)} src={previewUrl(item)} />
                </div>
                <div className="file-copy">
                  <strong>{mediaName(item.path)}</strong>
                  <span>{item.contentType}</span>
                  <span>{item.path}</span>
                </div>
                <div className="file-meta">
                  <span>{formatBytes(item.byteSize)}</span>
                  <span className="tag-pill">{item.visibility}</span>
                </div>
              </button>
            ))
          )}
        </section>
      </section>

      <aside className="explorer-inspector">
        <div className="inspector-card">
          {selectedItem ? (
            <>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Properties</p>
                  <h2>{mediaName(selectedItem.path)}</h2>
                </div>
                <span className="tag-pill">{selectedItem.visibility}</span>
              </div>
              <div className="inspector-preview">
                <img alt={mediaName(selectedItem.path)} src={previewUrl(selectedItem)} />
              </div>
              <dl className="property-grid">
                <div>
                  <dt>Path</dt>
                  <dd>{selectedItem.path}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{selectedItem.contentType}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{formatBytes(selectedItem.byteSize)}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(selectedItem.createdAt)}</dd>
                </div>
              </dl>
              <div className="inspector-actions">
                <a className="ghost-link" href={selectedItem.publicUrl} rel="noreferrer" target="_blank">
                  Open Public
                </a>
                <button className="ghost-button" onClick={() => void handleCopySignedUrl(selectedItem.path)} type="button">
                  Copy Signed URL
                </button>
                <a className="ghost-link" href={selectedItem.transformUrls.resize} rel="noreferrer" target="_blank">
                  Resize
                </a>
                <a className="ghost-link" href={selectedItem.transformUrls.crop} rel="noreferrer" target="_blank">
                  Crop
                </a>
                {canUpload ? (
                  <button className="danger-button" onClick={() => void handleDelete(selectedItem.path)} type="button">
                    Delete
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="placeholder-panel inspector-empty">
              Select a file to inspect metadata, transforms, and links.
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
