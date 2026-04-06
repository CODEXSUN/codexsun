import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from "react"
import {
  FolderPlusIcon,
  LayoutGridIcon,
  LinkIcon,
  ImageIcon,
  ListIcon,
  LoaderCircleIcon,
  PencilIcon,
  PresentationIcon,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import {
  createFrameworkMediaFolder,
  deactivateFrameworkMediaItem,
  listFrameworkMedia,
  listFrameworkMediaFolders,
  updateFrameworkMediaItem,
  uploadFrameworkMediaImage,
} from "./media-api"
import {
  handleMediaPreviewError,
  normalizeMediaUrl,
  resolveMediaPreviewUrl,
} from "./media-url"

type ScopeFilter = "all" | MediaStorageScope
type MediaPreviewLayout = "list" | "small-grid" | "presentation"

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
  const normalizedUrl = normalizeMediaUrl(fileUrl) ?? fileUrl

  if (typeof window === "undefined") {
    return normalizedUrl
  }

  return new URL(normalizedUrl, window.location.origin).toString()
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
  const previewUrl = resolveMediaPreviewUrl(
    asset.thumbnailUrl ?? asset.fileUrl,
    asset.altText ?? asset.title ?? asset.fileName
  )

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
            src={previewUrl}
            alt={asset.altText ?? asset.title ?? asset.fileName}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            onError={(event) =>
              handleMediaPreviewError(
                event,
                asset.altText ?? asset.title ?? asset.fileName
              )
            }
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
  const [previewLayout, setPreviewLayout] = useState<MediaPreviewLayout>("small-grid")
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const normalizedSelectedUrl = normalizeMediaUrl(selectedUrl)

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

  function openFilePicker() {
    fileInputRef.current?.click()
  }

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

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    void handleFilesSelected(event.dataTransfer.files)
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

  const mediaTabs = useMemo<AnimatedContentTab[]>(() => {
    return [
      {
        label: "Upload",
        value: "upload",
        content: (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div
              className={cn(
                "rounded-xl border border-dashed bg-background/80 p-4 transition",
                isDragOver
                  ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                  : "border-border/70"
              )}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => void handleFilesSelected(event.target.files)}
              />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={openFilePicker} disabled={isUploading}>
                    {isUploading ? (
                      <LoaderCircleIcon className="size-4 animate-spin" />
                    ) : (
                      <UploadIcon className="size-4" />
                    )}
                    Upload Images
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Bulk upload up to {MAX_FILES_PER_UPLOAD} images in one batch.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-foreground">Drag and drop images here</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total upload size up to {readableFileSize(MAX_TOTAL_UPLOAD_BYTES)}.
                  </p>
                </div>
                {activeUploads.length > 0 ? (
                  <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                    Uploading: {activeUploads.join(", ")}
                  </div>
                ) : null}
              </div>
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
        ),
      },
      {
        label: "Browse",
        value: "browse",
        content: (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.7fr))]">
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
              <Label>Preview Layout</Label>
              <Select
                value={previewLayout}
                onValueChange={(value) => setPreviewLayout(value as MediaPreviewLayout)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Preview layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="small-grid">Small Grid</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ),
      },
      {
        label: "Folders",
        value: "folders",
        content: (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
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
            <div className="rounded-xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-medium text-foreground">Available folders</p>
              <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                {folders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No folders created yet.</p>
                ) : (
                  folders.map((folder) => (
                    <Badge key={folder.id} variant="outline" className="rounded-xl px-3 py-1">
                      {folder.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "External URL",
        value: "external-url",
        content: onSelect ? (
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
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
            External URL selection is available only when the media browser is opened from a picker field.
          </div>
        ),
      },
    ]
  }, [
    activeUploads,
    allowedScopes,
    externalUrl,
    externalUrlError,
    folderFilter,
    folders,
    isDragOver,
    isCreatingFolder,
    isUploading,
    newFolderName,
    onSelect,
    previewLayout,
    scopeFilter,
    search,
    uploadFolderId,
    uploadScope,
  ])

  return (
    <div className="min-h-0 space-y-3">
      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader className={cn("pb-3", compact ? "pt-4" : undefined)}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Media Library</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={openFilePicker} disabled={isUploading}>
                {isUploading ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <UploadIcon className="size-4" />
                )}
                Upload
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
        <CardContent className="space-y-3 pt-0">
          <AnimatedTabs tabs={mediaTabs} defaultTabValue="upload" />
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="border-b border-border/70 pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Preview</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={previewLayout === "list" ? "default" : "outline"}
                onClick={() => setPreviewLayout("list")}
              >
                <ListIcon className="size-4" />
                List
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewLayout === "small-grid" ? "default" : "outline"}
                onClick={() => setPreviewLayout("small-grid")}
              >
                <LayoutGridIcon className="size-4" />
                Small Grid
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewLayout === "presentation" ? "default" : "outline"}
                onClick={() => setPreviewLayout("presentation")}
              >
                <PresentationIcon className="size-4" />
                Presentation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={cn(
            "min-h-0 overflow-y-auto p-4",
            compact ? "max-h-[min(42vh,24rem)]" : "max-h-[min(48vh,30rem)]"
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
          ) : previewLayout === "list" ? (
            <div className="space-y-3">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    "grid gap-3 rounded-[1.2rem] border border-border/70 bg-background/70 p-3 sm:grid-cols-[88px_minmax(0,1fr)_auto]",
                    normalizedSelectedUrl === asset.fileUrl
                      ? "border-primary ring-2 ring-primary/15"
                      : undefined
                  )}
                >
                  <div className="h-22 overflow-hidden rounded-xl bg-muted/60">
                    {canRenderImagePreview(asset) ? (
                      <img
                        src={resolveMediaPreviewUrl(
                          asset.thumbnailUrl ?? asset.fileUrl,
                          asset.altText ?? asset.title ?? asset.fileName
                        )}
                        alt={asset.altText ?? asset.title ?? asset.fileName}
                        className="h-full w-full object-cover"
                        onError={(event) =>
                          handleMediaPreviewError(
                            event,
                            asset.altText ?? asset.title ?? asset.fileName
                          )
                        }
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {asset.title ?? asset.fileName}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {asset.originalName} · {asset.folderName ?? "Unfiled"} · {readableFileSize(asset.fileSize)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{asset.storageScope}</Badge>
                      <Badge variant="outline">{asset.fileType}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start justify-end gap-2">
                    {onSelect ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={normalizedSelectedUrl === asset.fileUrl ? "default" : "outline"}
                        onClick={() => onSelect(asset)}
                      >
                        {normalizedSelectedUrl === asset.fileUrl ? "Selected" : "Use Media"}
                      </Button>
                    ) : null}
                    <Button type="button" size="icon" variant="outline" onClick={() => openEditDialog(asset)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => void handleShareAsset(asset)}>
                      <Share2Icon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleDeleteAsset(asset)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : previewLayout === "presentation" ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredAssets.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={normalizedSelectedUrl === asset.fileUrl}
                  onDelete={(item) => void handleDeleteAsset(item)}
                  onEdit={openEditDialog}
                  onSelect={onSelect}
                  onShare={(item) => void handleShareAsset(item)}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                compact
                  ? "grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
              )}
            >
              {filteredAssets.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={normalizedSelectedUrl === asset.fileUrl}
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
