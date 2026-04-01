import type {
  Media,
  MediaFolder,
  MediaTagInput,
  MediaUpsertPayload,
  MediaUsageInput,
  MediaVersionInput,
} from '@shared/index'
import { useEffect, useState, type FormEvent, type PropsWithChildren } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { MediaAssetManagerDialog } from '@/components/forms/media-asset-manager-dialog'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createMedia,
  getMedia,
  HttpError,
  listMediaFolders,
  updateMedia,
} from '@/shared/api/client'
import { showFailedActionToast, showSavedToast } from '@/shared/notifications/toast'

type MediaFormValues = MediaUpsertPayload

const emptyTag = (): MediaTagInput => ({ name: '' })
const emptyUsage = (): MediaUsageInput => ({ entityType: '', entityId: '', usageType: '' })
const emptyVersion = (): MediaVersionInput => ({ versionType: '', filePath: '', width: null, height: null })

function createDefaultValues(): MediaFormValues {
  return {
    fileName: '',
    originalName: '',
    filePath: '',
    thumbnailPath: null,
    fileType: 'image',
    mimeType: 'image/png',
    fileSize: 0,
    width: null,
    height: null,
    altText: null,
    title: null,
    folderId: null,
    storageScope: 'public',
    isOptimized: false,
    isActive: true,
    tags: [],
    usages: [],
    versions: [],
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to save media asset.'
}

function toFormValues(item: Media): MediaFormValues {
  return {
    fileName: item.fileName,
    originalName: item.originalName,
    filePath: item.filePath,
    thumbnailPath: item.thumbnailPath,
    fileType: item.fileType,
    mimeType: item.mimeType,
    fileSize: item.fileSize,
    width: item.width,
    height: item.height,
    altText: item.altText,
    title: item.title,
    folderId: item.folderId,
    storageScope: item.storageScope,
    isOptimized: item.isOptimized,
    isActive: item.isActive,
    tags: item.tags.map((tag) => ({ name: tag.name })),
    usages: item.usages.map((usage) => ({ entityType: usage.entityType, entityId: usage.entityId, usageType: usage.usageType })),
    versions: item.versions.map((version) => ({ versionType: version.versionType, filePath: version.filePath, width: version.width, height: version.height })),
  }
}

function Section({
  title,
  description,
  addLabel,
  onAdd,
  children,
}: PropsWithChildren<{ title: string; description: string; addLabel?: string; onAdd?: () => void }>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {addLabel && onAdd ? (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            {addLabel}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  )
}

function Row({ children, onRemove }: PropsWithChildren<{ onRemove: () => void }>) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 p-4">
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4" />
          Remove
        </Button>
      </div>
      {children}
    </div>
  )
}

export function MediaFormPage() {
  const navigate = useNavigate()
  const { mediaId } = useParams()
  const isEditMode = Boolean(mediaId)
  const [values, setValues] = useState<MediaFormValues>(createDefaultValues())
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadFolders() {
      try {
        const items = await listMediaFolders()
        if (!cancelled) setFolders(items.filter((item) => item.isActive))
      } catch (error) {
        if (!cancelled) setErrorMessage(toErrorMessage(error))
      }
    }

    void loadFolders()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadMedia() {
      if (!mediaId) return

      setLoading(true)
      setErrorMessage(null)

      try {
        const item = await getMedia(mediaId)
        if (!cancelled) setValues(toFormValues(item))
      } catch (error) {
        if (!cancelled) setErrorMessage(toErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadMedia()
    return () => { cancelled = true }
  }, [mediaId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrorMessage(null)

    try {
      const savedAsset = mediaId
        ? await updateMedia(mediaId, values)
        : await createMedia(values)

      showSavedToast({
        entityLabel: 'media asset',
        recordName: savedAsset.title ?? savedAsset.fileName,
        referenceId: savedAsset.id,
        mode: mediaId ? 'update' : 'create',
      })

      void navigate('/admin/dashboard/media')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'media asset',
        action: mediaId ? 'update' : 'save',
        detail: message,
      })
    } finally {
      setSaving(false)
    }
  }

  const overviewTab: AnimatedContentTab = {
    label: 'Asset',
    value: 'asset',
    content: (
      <Section title="Asset Details" description="Define the primary media identity, storage scope, and file reference.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-muted/30 px-4 py-3 md:col-span-2">
          <div>
            <p className="font-medium text-foreground">Quick Upload</p>
            <p className="text-sm text-muted-foreground">Upload through the popup media manager, persist the asset immediately, and continue on that saved asset record.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
            Upload or Choose Asset
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2"><Label>File Name</Label><Input value={values.fileName} onChange={(event) => setValues((current) => ({ ...current, fileName: event.target.value }))} required /></div>
          <div className="grid gap-2"><Label>Original Name</Label><Input value={values.originalName} onChange={(event) => setValues((current) => ({ ...current, originalName: event.target.value }))} required /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Storage Path</Label><Input value={values.filePath} onChange={(event) => setValues((current) => ({ ...current, filePath: event.target.value }))} placeholder="catalog/hero/banner.png" required /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Thumbnail Path</Label><Input value={values.thumbnailPath ?? ''} onChange={(event) => setValues((current) => ({ ...current, thumbnailPath: event.target.value || null }))} placeholder="catalog/hero/banner-thumb.png" /></div>
          <div className="grid gap-2">
            <Label>Storage Scope</Label>
            <select value={values.storageScope} onChange={(event) => setValues((current) => ({ ...current, storageScope: event.target.value as MediaFormValues['storageScope'] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label>File Type</Label>
            <select value={values.fileType} onChange={(event) => setValues((current) => ({ ...current, fileType: event.target.value as MediaFormValues['fileType'] }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30">
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid gap-2"><Label>Folder</Label>
            <select value={values.folderId ?? ''} onChange={(event) => setValues((current) => ({ ...current, folderId: event.target.value || null }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30">
              <option value="">Root</option>
              {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
          </div>
          <div className="grid gap-2"><Label>MIME Type</Label><Input value={values.mimeType} onChange={(event) => setValues((current) => ({ ...current, mimeType: event.target.value }))} required /></div>
          <div className="grid gap-2"><Label>File Size (bytes)</Label><Input type="number" min="0" value={values.fileSize} onChange={(event) => setValues((current) => ({ ...current, fileSize: Number(event.target.value || 0) }))} /></div>
          <label className="flex items-center gap-3"><Checkbox checked={values.isOptimized} onCheckedChange={(checked) => setValues((current) => ({ ...current, isOptimized: Boolean(checked) }))} /><span className="text-sm font-medium">Optimized asset</span></label>
          <label className="flex items-center gap-3"><Checkbox checked={values.isActive} onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: Boolean(checked) }))} /><span className="text-sm font-medium">Active asset</span></label>
        </div>
      </Section>
    ),
  }

  const metadataTab: AnimatedContentTab = {
    label: 'Metadata',
    value: 'metadata',
    content: (
      <>
        <Section title="Presentation Metadata" description="Maintain title, alt text, and dimension metadata for the asset.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label>Title</Label><Input value={values.title ?? ''} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value || null }))} /></div>
            <div className="grid gap-2"><Label>Alt Text</Label><Input value={values.altText ?? ''} onChange={(event) => setValues((current) => ({ ...current, altText: event.target.value || null }))} /></div>
            <div className="grid gap-2"><Label>Width</Label><Input type="number" min="0" value={values.width ?? ''} onChange={(event) => setValues((current) => ({ ...current, width: event.target.value ? Number(event.target.value) : null }))} /></div>
            <div className="grid gap-2"><Label>Height</Label><Input type="number" min="0" value={values.height ?? ''} onChange={(event) => setValues((current) => ({ ...current, height: event.target.value ? Number(event.target.value) : null }))} /></div>
            <div className="grid gap-2 md:col-span-2"><Label>Notes</Label><Textarea value={values.title && values.altText ? `${values.title}\n${values.altText}` : ''} readOnly rows={3} className="opacity-70" /></div>
          </div>
        </Section>
        <Section title="Tags" description="Tag assets for fast filtering and reuse." addLabel="Add Tag" onAdd={() => setValues((current) => ({ ...current, tags: [...current.tags, emptyTag()] }))}>
          {values.tags.map((tag, index) => (
            <Row key={`tag-${index}`} onRemove={() => setValues((current) => ({ ...current, tags: current.tags.filter((_, rowIndex) => rowIndex !== index) }))}>
              <div className="grid gap-2">
                <Label>Tag Name</Label>
                <Input value={tag.name} onChange={(event) => setValues((current) => ({ ...current, tags: current.tags.map((entry, rowIndex) => rowIndex === index ? { ...entry, name: event.target.value } : entry) }))} />
              </div>
            </Row>
          ))}
        </Section>
      </>
    ),
  }

  const usageTab: AnimatedContentTab = {
    label: 'Usage',
    value: 'usage',
    content: (
      <Section title="Usage References" description="Track where this asset is used across products, banners, categories, or other records." addLabel="Add Usage" onAdd={() => setValues((current) => ({ ...current, usages: [...current.usages, emptyUsage()] }))}>
        {values.usages.map((usage, index) => (
          <Row key={`usage-${index}`} onRemove={() => setValues((current) => ({ ...current, usages: current.usages.filter((_, rowIndex) => rowIndex !== index) }))}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2"><Label>Entity Type</Label><Input value={usage.entityType} onChange={(event) => setValues((current) => ({ ...current, usages: current.usages.map((entry, rowIndex) => rowIndex === index ? { ...entry, entityType: event.target.value } : entry) }))} /></div>
              <div className="grid gap-2"><Label>Entity ID</Label><Input value={usage.entityId} onChange={(event) => setValues((current) => ({ ...current, usages: current.usages.map((entry, rowIndex) => rowIndex === index ? { ...entry, entityId: event.target.value } : entry) }))} /></div>
              <div className="grid gap-2"><Label>Usage Type</Label><Input value={usage.usageType} onChange={(event) => setValues((current) => ({ ...current, usages: current.usages.map((entry, rowIndex) => rowIndex === index ? { ...entry, usageType: event.target.value } : entry) }))} /></div>
            </div>
          </Row>
        ))}
      </Section>
    ),
  }

  const versionsTab: AnimatedContentTab = {
    label: 'Versions',
    value: 'versions',
    content: (
      <Section title="Derived Versions" description="Record thumbnail, small, medium, or custom generated variants for the asset." addLabel="Add Version" onAdd={() => setValues((current) => ({ ...current, versions: [...current.versions, emptyVersion()] }))}>
        {values.versions.map((version, index) => (
          <Row key={`version-${index}`} onRemove={() => setValues((current) => ({ ...current, versions: current.versions.filter((_, rowIndex) => rowIndex !== index) }))}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2"><Label>Version Type</Label><Input value={version.versionType} onChange={(event) => setValues((current) => ({ ...current, versions: current.versions.map((entry, rowIndex) => rowIndex === index ? { ...entry, versionType: event.target.value } : entry) }))} /></div>
              <div className="grid gap-2"><Label>Version Path</Label><Input value={version.filePath} onChange={(event) => setValues((current) => ({ ...current, versions: current.versions.map((entry, rowIndex) => rowIndex === index ? { ...entry, filePath: event.target.value } : entry) }))} /></div>
              <div className="grid gap-2"><Label>Width</Label><Input type="number" min="0" value={version.width ?? ''} onChange={(event) => setValues((current) => ({ ...current, versions: current.versions.map((entry, rowIndex) => rowIndex === index ? { ...entry, width: event.target.value ? Number(event.target.value) : null } : entry) }))} /></div>
              <div className="grid gap-2"><Label>Height</Label><Input type="number" min="0" value={version.height ?? ''} onChange={(event) => setValues((current) => ({ ...current, versions: current.versions.map((entry, rowIndex) => rowIndex === index ? { ...entry, height: event.target.value ? Number(event.target.value) : null } : entry) }))} /></div>
            </div>
          </Row>
        ))}
      </Section>
    ),
  }

  if (loading) {
    return <Card><CardContent className="p-8 text-sm text-muted-foreground">Loading media asset...</CardContent></Card>
  }

  return (
    <form className="space-y-6" onSubmit={(event) => { void handleSubmit(event) }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/media">
              <ArrowLeft className="size-4" />
              Back to media
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold text-foreground">{isEditMode ? 'Edit Media Asset' : 'New Media Asset'}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Capture media metadata, storage scope, usage references, and derivative versions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate('/admin/dashboard/media') }}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Media Asset'}</Button>
        </div>
      </div>

      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <AnimatedTabs defaultTabValue="asset" tabs={[overviewTab, metadataTab, usageTab, versionsTab]} />

      <MediaAssetManagerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        allowPrivateAssets
        onSelect={(asset) => {
          setValues(toFormValues(asset))
          void navigate(`/admin/dashboard/media/${asset.id}/edit`)
        }}
        title="Upload or Choose Media Asset"
        description="Persist a new media asset through the popup workflow or pick an existing one from the media library."
      />
    </form>
  )
}

