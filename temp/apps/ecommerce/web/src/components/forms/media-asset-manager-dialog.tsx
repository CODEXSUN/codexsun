import type { Media, MediaFolder, MediaImageUploadPayload, MediaStorageScope, MediaSummary } from '@shared/index'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, Search, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getMedia, HttpError, listMedia, listMediaFolders, uploadMediaImage } from '@/shared/api/client'

type ManagerTab = 'library' | 'upload'
type UploadDetailsTab = 'basic' | 'seo' | 'details'

interface MediaAssetManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (asset: Media) => void
  title?: string
  description?: string
  defaultStorageScope?: MediaStorageScope
  allowPrivateAssets?: boolean
}

interface UploadDraft {
  file: File
  dataUrl: string
  fileName: string
  originalName: string
  title: string
  altText: string
  storageScope: MediaStorageScope
  folderId: string | null
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Failed to load or upload media assets.'
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read the selected file as a data URL.'))
        return
      }

      resolve(reader.result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

function createDraft(file: File, dataUrl: string, storageScope: MediaStorageScope): UploadDraft {
  const fileName = file.name.replace(/\.[^.]+$/, '') || 'image'
  const readableName = fileName.replace(/[-_]+/g, ' ').trim() || 'Image asset'

  return {
    file,
    dataUrl,
    fileName,
    originalName: file.name,
    title: readableName,
    altText: readableName,
    storageScope,
    folderId: null,
  }
}

function toFileSizeLabel(file: File | null) {
  if (!file) {
    return '--'
  }

  const sizeInKb = file.size / 1024
  if (sizeInKb < 1024) {
    return `${Math.max(1, Math.round(sizeInKb))} KB`
  }

  return `${(sizeInKb / 1024).toFixed(1)} MB`
}

function fileExtension(name: string) {
  const segments = name.split('.')
  return segments.length > 1 ? segments.at(-1)?.toUpperCase() ?? '--' : '--'
}

function getPreviewUrl(item: MediaSummary) {
  return item.thumbnailUrl ?? item.fileUrl
}

export function MediaAssetManagerDialog({
  open,
  onOpenChange,
  onSelect,
  title = 'Upload or Choose Media Asset',
  description = 'Persist a new image asset or pick an existing one from the media library.',
  defaultStorageScope = 'public',
  allowPrivateAssets = false,
}: MediaAssetManagerDialogProps) {
  const [activeTab, setActiveTab] = useState<ManagerTab>('library')
  const [detailsTab, setDetailsTab] = useState<UploadDetailsTab>('basic')
  const [items, setItems] = useState<MediaSummary[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [draft, setDraft] = useState<UploadDraft | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const filteredItems = useMemo(
    () => items.filter((item) => item.fileType === 'image' && (allowPrivateAssets || item.storageScope === 'public')),
    [allowPrivateAssets, items],
  )

  const visibleItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) {
      return filteredItems
    }

    return filteredItems.filter((item) =>
      [item.fileName, item.originalName, item.title ?? '', item.folderName ?? '']
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [filteredItems, searchValue])

  const selectedAsset = visibleItems.find((item) => item.id === selectedAssetId)
    ?? filteredItems.find((item) => item.id === selectedAssetId)
    ?? null

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    async function loadData() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const [mediaItems, folderItems] = await Promise.all([listMedia(), listMediaFolders()])

        if (cancelled) {
          return
        }

        setItems(mediaItems.filter((item) => item.isActive))
        setFolders(folderItems.filter((item) => item.isActive))
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setActiveTab('library')
      setDetailsTab('basic')
      setSearchValue('')
      setSelectedAssetId(null)
      setDraft(null)
      setDragActive(false)
      setErrorMessage(null)
    }
  }, [open])

  function updateDraft(patch: Partial<UploadDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) {
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setDraft(createDraft(file, dataUrl, defaultStorageScope))
      setActiveTab('upload')
      setDetailsTab('basic')
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    }
  }

  async function handleConfirm() {
    if (activeTab === 'library') {
      if (!selectedAsset) {
        setErrorMessage('Select an image asset from the library first.')
        return
      }

      onSelect(await getMedia(selectedAsset.id))
      onOpenChange(false)
      return
    }

    if (!draft) {
      setErrorMessage('Choose an image file first.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const payload: MediaImageUploadPayload = {
        fileName: draft.fileName.trim() || 'image',
        originalName: draft.originalName.trim() || draft.file.name,
        dataUrl: draft.dataUrl,
        folderId: draft.folderId,
        storageScope: draft.storageScope,
        title: draft.title.trim() || null,
        altText: draft.altText.trim() || null,
        isActive: true,
      }
      const asset = await uploadMediaImage(payload)
      onSelect(asset)
      onOpenChange(false)
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,72rem)] max-w-6xl flex-col gap-0 overflow-hidden border border-border/70 bg-background p-0">
        <div className="border-b border-border/70 px-6 py-5">
          <DialogTitle className="text-xl font-semibold text-foreground">{title}</DialogTitle>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ManagerTab)} className="flex min-h-0 flex-col gap-5">
            <TabsList>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-0 grid gap-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
                <div className="rounded-[1.75rem] border border-border/70 bg-card/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        placeholder="Search image assets"
                        className="pl-9"
                      />
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={() => setActiveTab('upload')}>
                      <ImagePlus className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <p>{visibleItems.length} image assets</p>
                    <p>Click one to preview</p>
                  </div>

                  <div className="mt-4 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                    {loading ? <p className="text-sm text-muted-foreground">Loading media assets...</p> : null}
                    {!loading && visibleItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No image assets match the current filter.</p>
                    ) : null}
                    {visibleItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedAssetId(item.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          selectedAssetId === item.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border/70 bg-background/60 hover:border-primary/40 hover:bg-background'
                        }`}
                      >
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted">
                          {item.fileType === 'image' && item.storageScope === 'public' ? (
                            <img
                              src={getPreviewUrl(item)}
                              alt={item.altText ?? item.fileName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <ImagePlus className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{item.title || item.fileName}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.originalName}</p>
                          <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {item.storageScope} | {item.folderName || 'Root'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-border/70 bg-card/50 p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
                    <div>
                      <p className="font-medium text-foreground">Image preview</p>
                      <p className="text-sm text-muted-foreground">
                        The preview pane keeps the full image scrollable so you can inspect the asset at its real size.
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setActiveTab('upload')}>
                      <ImagePlus className="size-4" />
                      Upload New
                    </Button>
                  </div>

                  <div className="mt-4">
                    {selectedAsset ? (
                      <div className="grid gap-4">
                        <div className="max-h-[28rem] overflow-auto rounded-[1.5rem] border border-border/70 bg-muted/30 p-4">
                          <img
                            src={selectedAsset.fileUrl}
                            alt={selectedAsset.altText ?? selectedAsset.fileName}
                            className="h-auto w-auto max-w-none"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="grid gap-3 rounded-[1.3rem] border border-border/70 bg-background/70 p-4 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{selectedAsset.title || selectedAsset.fileName}</p>
                            <span className="text-muted-foreground">-</span>
                            <p className="text-muted-foreground">{selectedAsset.originalName}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{selectedAsset.storageScope}</span>
                            <span>-</span>
                            <span>{selectedAsset.folderName || 'Root'}</span>
                            <span>-</span>
                            <span>{selectedAsset.width ?? '--'} x {selectedAsset.height ?? '--'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[28rem] flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-background shadow-sm">
                          <ImagePlus className="size-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">Select an image to inspect it</p>
                          <p className="max-w-sm text-sm text-muted-foreground">
                            Pick a thumbnail on the left to open the full image in a scrollable preview window.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-0 grid gap-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleFiles(event.target.files)
                  event.target.value = ''
                }}
              />

              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div
                  role="presentation"
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    setDragActive(false)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragActive(false)
                    void handleFiles(event.dataTransfer.files)
                  }}
                  className={`flex h-[15rem] flex-col items-center justify-center rounded-[1.9rem] border-2 border-dashed px-6 py-6 text-center transition lg:h-[18rem] ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border/70 bg-card/35'
                  }`}
                >
                  <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-background shadow-sm">
                    <Upload className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">Drop an image here</p>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">PNG, JPG, GIF, SVG, or WebP. Upload stays temporary until you confirm the media asset details below.</p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Choose File
                    </Button>
                    {draft ? (
                      <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        Replace Image
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="h-[15rem] overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/40 lg:h-[18rem]">
                  {draft ? (
                    <div className="flex h-full items-center justify-center bg-muted/30 p-4">
                      <img src={draft.dataUrl} alt={draft.altText || draft.fileName} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-background shadow-sm">
                        <ImagePlus className="size-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Preview panel</p>
                        <p className="text-sm text-muted-foreground">Choose or drop an image to inspect the final crop before persisting the media asset.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/45">
                <Tabs value={detailsTab} onValueChange={(value) => setDetailsTab(value as UploadDetailsTab)} className="gap-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
                    <div>
                      <p className="font-medium text-foreground">Asset configuration</p>
                      <p className="text-sm text-muted-foreground">Review the upload draft, then confirm to persist it as a media asset.</p>
                    </div>
                    <TabsList>
                      <TabsTrigger value="basic">Basic Details</TabsTrigger>
                      <TabsTrigger value="seo">SEO Content</TabsTrigger>
                      <TabsTrigger value="details">File Details</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="basic" className="m-0 grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Name</Label>
                      <Input
                        value={draft?.fileName ?? ''}
                        onChange={(event) => updateDraft({ fileName: event.target.value })}
                        placeholder="catalog-hero"
                        disabled={!draft}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Original Name</Label>
                      <Input
                        value={draft?.originalName ?? ''}
                        onChange={(event) => updateDraft({ originalName: event.target.value })}
                        placeholder="catalog-hero.jpg"
                        disabled={!draft}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Storage Scope</Label>
                      <select
                        value={draft?.storageScope ?? defaultStorageScope}
                        onChange={(event) => updateDraft({ storageScope: event.target.value as MediaStorageScope })}
                        disabled={!draft}
                        className="h-10 rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="public">Public</option>
                        {allowPrivateAssets ? <option value="private">Private</option> : null}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Folder</Label>
                      <select
                        value={draft?.folderId ?? ''}
                        onChange={(event) => updateDraft({ folderId: event.target.value || null })}
                        disabled={!draft}
                        className="h-10 rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Root</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                      </select>
                    </div>
                  </TabsContent>

                  <TabsContent value="seo" className="m-0 grid gap-4 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input
                          value={draft?.title ?? ''}
                          onChange={(event) => updateDraft({ title: event.target.value })}
                          placeholder="Homepage hero image"
                          disabled={!draft}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Alt Text</Label>
                        <Textarea
                          value={draft?.altText ?? ''}
                          onChange={(event) => updateDraft({ altText: event.target.value })}
                          placeholder="Describe what appears in the image for accessibility and search relevance."
                          rows={5}
                          disabled={!draft}
                        />
                      </div>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
                      <p className="text-sm font-medium text-foreground">SEO guidance</p>
                      <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
                        <p>Use a clean asset title that business users can recognize quickly in the library.</p>
                        <p>Write alt text as a literal description of the image rather than a keyword list.</p>
                        <p>Keep the upload scoped to the right folder and visibility so later reuse is predictable.</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="m-0 grid gap-4 overflow-y-auto p-5 md:grid-cols-3">
                    <div className="rounded-[1.3rem] border border-border/70 bg-background/85 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mime Type</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{draft?.file.type || 'image/*'}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-border/70 bg-background/85 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">File Size</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{toFileSizeLabel(draft?.file ?? null)}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-border/70 bg-background/85 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Extension</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{fileExtension(draft?.originalName ?? '')}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-border/70 bg-background/85 p-4 md:col-span-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Persistence</p>
                      <p className="mt-2 text-sm text-muted-foreground">The file remains a local upload draft until you confirm with "Upload and Use Asset". Confirmation writes the file and creates the linked media asset record together.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>

          {errorMessage ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/70 px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={submitting || (activeTab === 'upload' && !draft)}>
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {activeTab === 'library' ? 'Use Selected Asset' : 'Upload and Use Asset'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
