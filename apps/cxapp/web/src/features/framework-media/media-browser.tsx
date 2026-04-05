import { useEffect, useMemo, useRef, useState } from "react"
import {
  FolderPlusIcon,
  LinkIcon,
  ImageIcon,
  LoaderCircleIcon,
  PencilIcon,
  RefreshCwIcon,
  Share2Icon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import type {
  MediaFolder,
  MediaStorageScope,
  MediaSummary,
} from "../../../../../framework/shared/media"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  createFrameworkMediaFolder,
  deactivateFrameworkMediaItem,
  listFrameworkMedia,
  listFrameworkMediaFolders,
  updateFrameworkMediaItem,
  uploadFrameworkMediaImage,
} from "./media-api"

type ScopeFilter = "all" | MediaStorageScope

const MAX_FILES_PER_UPLOAD = 5
const MAX_TOTAL_UPLOAD_BYTES = 25 * 1024 * 1024

function canRenderImagePreview(asset: Pick<MediaSummary, "fileType" | "storageScope" | "fileUrl">) {
  return asset.fileType === "image" && asset.storageScope === "public"
}

function readableFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function createAbsoluteAssetUrl(fileUrl: string) {
  if (typeof window === "undefined") {
    return fileUrl
  }

  return new URL(fileUrl, window.location.origin).toString()
}

function normalizeMediaSourceUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith("/")) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed
    }
  } catch {
    return null
  }

  return null
}

type MediaAssetCardProps = {
  asset: MediaSummary
  isSelected: boolean
  onDelete: (asset: MediaSummary) => void
  onEdit: (asset: MediaSummary) => void
  onSelect?: (asset: MediaSummary) => void
  onShare: (asset: MediaSummary) => void
}

function MediaAssetCard({
  asset,
  isSelected,
  onDelete,
  onEdit,
  onSelect,
  onShare,
}: MediaAssetCardProps) {
  return (
    <div
      className={cn(
        "group overflow-hidden rounded-[1.1rem] border bg-card/85 shadow-sm transition",
        isSelected ? "border-primary ring-2 ring-primary/15" : "border-border/70"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/60">
        {canRenderImagePreview(asset) ? (
          <img
            src={asset.fileUrl}
            alt={asset.altText ?? asset.title ?? asset.fileName}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/5 opacity-0 transition group-hover:opacity-100" />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8 rounded-lg bg-background/90"
            onClick={() => onEdit(asset)}
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8 rounded-lg bg-background/90"
            onClick={() => onShare(asset)}
          >
            <Share2Icon className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-8 rounded-lg bg-background/90 text-destructive hover:text-destructive"
            onClick={() => onDelete(asset)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
        {onSelect ? (
          <div className="absolute right-2 bottom-2 left-2 opacity-0 transition group-hover:opacity-100">
            <Button
              type="button"
              variant={isSelected ? "default" : "secondary"}
              size="sm"
              className="w-full bg-background/92"
              onClick={() => onSelect(asset)}
            >
              {isSelected ? "Selected" : "Use Media"}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {asset.title ?? asset.fileName}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {asset.folderName ?? "Unfiled"} · {readableFileSize(asset.fileSize)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{asset.storageScope}</Badge>
          <Badge variant="outline">{asset.fileType}</Badge>
        </div>
      </div>
    </div>
  )
}

export function FrameworkMediaBrowser({
  allowedScopes = ["public", "private"],
  compact = false,
  onSelect,
  selectedUrl,
}: {
  allowedScopes?: MediaStorageScope[]
  compact?: boolean
  onSelect?: (asset: MediaSummary) => void
  selectedUrl?: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [assets, setAssets] = useState<MediaSummary[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [search, setSearch] = useState("")
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>(
    allowedScopes.length === 1 ? allowedScopes[0] : "all"
  )
  const [folderFilter, setFolderFilter] = useState("all")
  const [uploadScope, setUploadScope] = useState<MediaStorageScope>(allowedScopes[0] ?? "public")
  const [uploadFolderId, setUploadFolderId] = useState("none")
  const [newFolderName, setNewFolderName] = useState("")
  const [editingAsset, setEditingAsset] = useState<MediaSummary | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editAltText, setEditAltText] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editFolderId, setEditFolderId] = useState("none")
  const [editScope, setEditScope] = useState<MediaStorageScope>("public")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [isSavingAsset, setIsSavingAsset] = useState(false)
  const [activeUploads, setActiveUploads] = useState<string[]>([])
  const [externalUrl, setExternalUrl] = useState(selectedUrl ?? "")
  const [externalUrlError, setExternalUrlError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setExternalUrl(selectedUrl ?? "")
  }, [selectedUrl])

  async function loadData() {
    setIsLoading(true)
    setError(null)

    try {
      const [mediaResponse, folderResponse] = await Promise.all([
        listFrameworkMedia(),
        listFrameworkMediaFolders(),
      ])
      setAssets(mediaResponse.items.filter((item) => item.isActive))
      setFolders(folderResponse.items.filter((item) => item.isActive))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load media library.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredAssets = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return assets.filter((asset) => {
      if (!allowedScopes.includes(asset.storageScope)) {
        return false
      }

      if (scopeFilter !== "all" && asset.storageScope !== scopeFilter) {
        return false
      }

      if (folderFilter !== "all" && asset.folderId !== folderFilter) {
        return false
      }

      if (!searchTerm) {
        return true
      }

      const haystack = [
        asset.title,
        asset.fileName,
        asset.originalName,
        asset.folderName,
        ...asset.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(searchTerm)
    })
  }, [allowedScopes, assets, folderFilter, scopeFilter, search])

  function openEditDialog(asset: MediaSummary) {
    setEditingAsset(asset)
    setEditTitle(asset.title ?? "")
    setEditAltText(asset.altText ?? "")
    setEditDescription(asset.description ?? "")
    setEditFolderId(asset.folderId ?? "none")
    setEditScope(asset.storageScope)
  }

  async function handleFilesSelected(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])

    if (files.length === 0) {
      return
    }

    if (files.length > MAX_FILES_PER_UPLOAD) {
      setError(`Upload up to ${MAX_FILES_PER_UPLOAD} images at a time.`)
      return
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      setError(
        `Selected files exceed the ${readableFileSize(MAX_TOTAL_UPLOAD_BYTES)} total upload limit.`
      )
      return
    }

    setIsUploading(true)
    setError(null)
    setActiveUploads(files.map((file) => file.name))

    try {
      const uploadedItems: MediaSummary[] = []

      for (const file of files) {
        const response = await uploadFrameworkMediaImage({
          file,
          folderId: uploadFolderId === "none" ? null : uploadFolderId,
          storageScope: uploadScope,
        })
        uploadedItems.push(response.item)
      }

      setAssets((current) => [...uploadedItems.reverse(), ...current])
      if (onSelect && uploadedItems[0]) {
        onSelect(uploadedItems[0])
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload media.")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setActiveUploads([])
      setIsUploading(false)
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()

    if (!name) {
      return
    }

    setIsCreatingFolder(true)
    setError(null)

    try {
      const response = await createFrameworkMediaFolder(name)
      setFolders((current) =>
        [...current, response.item].sort((left, right) => left.name.localeCompare(right.name))
      )
      setUploadFolderId(response.item.id)
      setNewFolderName("")
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create folder.")
    } finally {
      setIsCreatingFolder(false)
    }
  }

  async function handleDeleteAsset(asset: MediaSummary) {
    try {
      await deactivateFrameworkMediaItem(asset.id)
      setAssets((current) => current.filter((item) => item.id !== asset.id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete media.")
    }
  }

  async function handleShareAsset(asset: MediaSummary) {
    const shareUrl = createAbsoluteAssetUrl(asset.fileUrl)

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        return
      }
    } catch {
      // Fall through to prompt fallback below.
    }

    if (typeof window !== "undefined") {
      window.prompt("Copy media URL", shareUrl)
    }
  }

  async function handleSaveAsset() {
    if (!editingAsset) {
      return
    }

    setIsSavingAsset(true)
    setError(null)

    try {
      const response = await updateFrameworkMediaItem(editingAsset.id, {
        title: editTitle.trim() || null,
        altText: editAltText.trim() || null,
        description: editDescription.trim() || null,
        folderId: editFolderId === "none" ? null : editFolderId,
        storageScope: editScope,
        tags: editingAsset.tags,
        isActive: true,
      })

      setAssets((current) =>
        current.map((item) => (item.id === response.item.id ? response.item : item))
      )
      setEditingAsset(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update media.")
    } finally {
      setIsSavingAsset(false)
    }
  }

  function handleUseExternalUrl() {
    const normalizedUrl = normalizeMediaSourceUrl(externalUrl)

    if (!normalizedUrl) {
      setExternalUrlError("Enter a valid image URL or a root-relative media path.")
      return
    }

    setExternalUrlError(null)
    onSelect?.({
      id: `external:${normalizedUrl}`,
      fileName: normalizedUrl.split("/").pop() || "external-image",
      originalName: normalizedUrl,
      fileUrl: normalizedUrl,
      thumbnailUrl: normalizedUrl,
      fileType: "image",
      fileSize: 0,
      mimeType: "image/*",
      provider: "custom",
      storageScope: "public",
      folderId: null,
      folderName: null,
      title: null,
      altText: null,
      description: null,
      tags: [],
      width: null,
      height: null,
      isActive: true,
      backendKey: "external-url",
      disk: "external",
      root: "external",
      extension: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-4 min-h-0">
      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader className={compact ? "pb-4" : undefined}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Media Library</CardTitle>
              <CardDescription>
                Upload up to 5 images at once and reuse them anywhere in the application.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => void handleFilesSelected(event.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <UploadIcon className="size-4" />
                )}
                Upload Images
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void loadData()}
                disabled={isLoading}
              >
                <RefreshCwIcon className={cn("size-4", isLoading ? "animate-spin" : undefined)} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {onSelect ? (
            <div className="rounded-xl border border-border/70 bg-background/75 p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="grid gap-2">
                  <Label htmlFor="framework-media-external-url">External Image URL</Label>
                  <Input
                    id="framework-media-external-url"
                    value={externalUrl}
                    onChange={(event) => {
                      setExternalUrl(event.target.value)
                      if (externalUrlError) {
                        setExternalUrlError(null)
                      }
                    }}
                    placeholder="https://placehold.co/320x220/f4ebe1/3b2a20?text=Ethnic"
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleUseExternalUrl}>
                  <LinkIcon className="size-4" />
                  Use URL
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Paste an external image URL or a root-relative path like `/storage/...`.
              </p>
              {externalUrlError ? (
                <p className="mt-2 text-xs text-destructive">{externalUrlError}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.65fr))]">
            <div className="grid gap-2">
              <Label htmlFor="framework-media-search">Search</Label>
              <Input
                id="framework-media-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, file, folder, or tag"
              />
            </div>
            <div className="grid gap-2">
              <Label>View Scope</Label>
              <Select
                value={scopeFilter}
                onValueChange={(value) => setScopeFilter(value as ScopeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All scopes" />
                </SelectTrigger>
                <SelectContent>
                  {allowedScopes.length > 1 ? <SelectItem value="all">All scopes</SelectItem> : null}
                  {allowedScopes.map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {scope === "public" ? "Public" : "Private"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Filter Folder</Label>
              <Select value={folderFilter} onValueChange={setFolderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All folders</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Upload Scope</Label>
              <Select
                value={uploadScope}
                onValueChange={(value) => setUploadScope(value as MediaStorageScope)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  {allowedScopes.map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {scope === "public" ? "Public" : "Private"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Upload Folder</Label>
              <Select value={uploadFolderId} onValueChange={setUploadFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unfiled" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unfiled</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-2">
              <Label htmlFor="framework-media-folder-create">New Folder</Label>
              <Input
                id="framework-media-folder-create"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="Company Logos"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCreateFolder()}
                disabled={isCreatingFolder || newFolderName.trim().length === 0}
              >
                {isCreatingFolder ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <FolderPlusIcon className="size-4" />
                )}
                Create Folder
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-xs text-muted-foreground">
            Upload limit: {MAX_FILES_PER_UPLOAD} images per batch · total size up to{" "}
            {readableFileSize(MAX_TOTAL_UPLOAD_BYTES)}.
          </div>

          {activeUploads.length > 0 ? (
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              Uploading: {activeUploads.join(", ")}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardContent
          className={cn(
            "p-5 min-h-0 overflow-y-auto",
            compact ? "max-h-[min(46vh,28rem)]" : "max-h-[min(56vh,40rem)]"
          )}
        >
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
              <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
              Loading media library...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-[1.25rem] border border-dashed border-border/70 bg-background/60 text-sm text-muted-foreground">
              No media found for the current filters.
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                compact ? "grid-cols-2 lg:grid-cols-4 xl:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
              )}
            >
              {filteredAssets.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedUrl === asset.fileUrl}
                  onDelete={(item) => void handleDeleteAsset(item)}
                  onEdit={openEditDialog}
                  onSelect={onSelect}
                  onShare={(item) => void handleShareAsset(item)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editingAsset != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingAsset(null)
          }
        }}
      >
        <DialogContent className="w-[min(96vw,40rem)] max-w-[40rem] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>
              Update the visible metadata and storage scope for this asset.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="media-edit-title">Title</Label>
              <Input
                id="media-edit-title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="media-edit-alt">Alt Text</Label>
              <Input
                id="media-edit-alt"
                value={editAltText}
                onChange={(event) => setEditAltText(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="media-edit-description">Description</Label>
              <Textarea
                id="media-edit-description"
                rows={4}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Folder</Label>
                <Select value={editFolderId} onValueChange={setEditFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unfiled" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unfiled</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Scope</Label>
                <Select
                  value={editScope}
                  onValueChange={(value) => setEditScope(value as MediaStorageScope)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedScopes.map((scope) => (
                      <SelectItem key={scope} value={scope}>
                        {scope === "public" ? "Public" : "Private"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingAsset(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveAsset()} disabled={isSavingAsset}>
              {isSavingAsset ? "Saving..." : "Update Media"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
