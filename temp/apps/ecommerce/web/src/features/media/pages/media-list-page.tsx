import type { MediaFolder, MediaSummary } from '@shared/index'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  EditIcon,
  FolderOpen,
  ImageIcon,
  MoreHorizontalIcon,
  PowerIcon,
} from 'lucide-react'
import { CommonList } from '@/components/forms/CommonList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ActiveStatusBadge, StatusBadge } from '@/components/ui/status-badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createMediaFolder,
  deactivateMedia,
  deactivateMediaFolder,
  HttpError,
  listMedia,
  listMediaFolders,
  restoreMedia,
  restoreMediaFolder,
  updateMediaFolder,
} from '@/shared/api/client'
import { showFailedActionToast, showSavedToast, showStatusChangeToast } from '@/shared/notifications/toast'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load media assets.'
}

export function MediaListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<MediaSummary[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [folderName, setFolderName] = useState('')
  const [folderParentId, setFolderParentId] = useState<string | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [savingFolder, setSavingFolder] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const [mediaItems, folderItems] = await Promise.all([listMedia(), listMediaFolders()])
        if (!cancelled) {
          setItems(mediaItems)
          setFolders(folderItems)
        }
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

    void load()
    return () => { cancelled = true }
  }, [])

  const folderNameById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder.name])),
    [folders],
  )

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0 || [
        item.fileName,
        item.originalName,
        item.fileType,
        item.folderName,
        item.title,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && item.isActive)
        || (statusFilter === 'inactive' && !item.isActive)

      return matchesSearch && matchesStatus
    })
  }, [items, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  async function handleToggleActive(item: MediaSummary) {
    setErrorMessage(null)

    try {
      if (item.isActive) await deactivateMedia(item.id)
      else await restoreMedia(item.id)

      setItems((current) => current.map((entry) => (
        entry.id === item.id ? { ...entry, isActive: !entry.isActive } : entry
      )))
      showStatusChangeToast({
        entityLabel: 'media asset',
        recordName: item.title ?? item.fileName,
        referenceId: item.id,
        action: item.isActive ? 'deactivate' : 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'media asset',
        action: item.isActive ? 'deactivate' : 'restore',
        detail: message,
      })
    }
  }

  async function handleToggleFolderActive(folder: MediaFolder) {
    setErrorMessage(null)

    try {
      if (folder.isActive) await deactivateMediaFolder(folder.id)
      else await restoreMediaFolder(folder.id)

      setFolders((current) => current.map((entry) => (
        entry.id === folder.id ? { ...entry, isActive: !entry.isActive } : entry
      )))
      showStatusChangeToast({
        entityLabel: 'folder',
        recordName: folder.name,
        referenceId: folder.id,
        action: folder.isActive ? 'deactivate' : 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'folder',
        action: folder.isActive ? 'deactivate' : 'restore',
        detail: message,
      })
    }
  }

  function startFolderEdit(folder: MediaFolder) {
    setEditingFolderId(folder.id)
    setFolderName(folder.name)
    setFolderParentId(folder.parentId)
  }

  function resetFolderForm() {
    setEditingFolderId(null)
    setFolderName('')
    setFolderParentId(null)
  }

  async function handleFolderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingFolder(true)
    setErrorMessage(null)

    try {
      const payload = { name: folderName, parentId: folderParentId, isActive: true }
      const folder = editingFolderId
        ? await updateMediaFolder(editingFolderId, payload)
        : await createMediaFolder(payload)

      setFolders((current) => {
        if (editingFolderId) {
          return current.map((entry) => (entry.id === folder.id ? folder : entry))
        }

        return [folder, ...current]
      })

      showSavedToast({
        entityLabel: 'folder',
        recordName: folder.name,
        referenceId: folder.id,
        mode: editingFolderId ? 'update' : 'create',
      })

      resetFolderForm()
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'folder',
        action: editingFolderId ? 'update' : 'save',
        detail: message,
      })
    } finally {
      setSavingFolder(false)
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Folders</CardTitle>
              <CardDescription>Organize public and private assets into reusable folder groups.</CardDescription>
            </div>
            <Badge variant="outline">{folders.length} folders</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <form className="space-y-4 rounded-[1.5rem] border border-border/70 p-4" onSubmit={(event) => { void handleFolderSubmit(event) }}>
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">{editingFolderId ? 'Edit folder' : 'New folder'}</h3>
              <p className="text-sm text-muted-foreground">Maintain the folder tree used by media records.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input id="folder-name" value={folderName} onChange={(event) => setFolderName(event.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="folder-parent">Parent folder</Label>
              <select
                id="folder-parent"
                value={folderParentId ?? ''}
                onChange={(event) => setFolderParentId(event.target.value || null)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <option value="">Root</option>
                {folders
                  .filter((folder) => folder.id !== editingFolderId)
                  .map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={savingFolder}>{savingFolder ? 'Saving...' : editingFolderId ? 'Update Folder' : 'Save Folder'}</Button>
              {editingFolderId ? <Button type="button" variant="outline" onClick={resetFolderForm}>Cancel</Button> : null}
            </div>
          </form>

          <div className="space-y-3">
            {folders.map((folder) => (
              <div key={folder.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-border/70 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="size-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">{folder.name}</p>
                    <ActiveStatusBadge isActive={folder.isActive} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Parent: {folder.parentId ? folderNameById.get(folder.parentId) ?? 'Unknown folder' : 'Root'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => startFolderEdit(folder)}>
                    <EditIcon className="size-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleToggleFolderActive(folder)}>
                    <PowerIcon className="size-4" />
                    {folder.isActive ? 'Deactivate' : 'Restore'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CommonList
        header={{
          pageTitle: 'Media Manager',
          pageDescription: 'Manage media metadata, storage scope, folders, tags, usage references, and derived versions.',
          addLabel: 'New Asset',
          onAddClick: () => {
            void navigate('/admin/dashboard/media/new')
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: 'Search media',
        }}
        filters={{
          buttonLabel: 'Media filters',
          options: [
            { key: 'all', label: 'All assets', isActive: statusFilter === 'all', onSelect: () => setStatusFilter('all') },
            { key: 'active', label: 'Active only', isActive: statusFilter === 'active', onSelect: () => setStatusFilter('active') },
            { key: 'inactive', label: 'Inactive only', isActive: statusFilter === 'inactive', onSelect: () => setStatusFilter('inactive') },
          ],
          activeFilters: statusFilter === 'all' ? [] : [{ key: 'status', label: 'Status', value: statusFilter === 'active' ? 'Active' : 'Inactive' }],
          onRemoveFilter: () => setStatusFilter('all'),
          onClearAllFilters: () => {
            setStatusFilter('all')
            setCurrentPage(1)
          },
        }}
        table={{
          columns: [
            { id: 'serial', header: 'Sl.No', cell: (item) => ((safeCurrentPage - 1) * pageSize) + paginatedItems.findIndex((entry) => entry.id === item.id) + 1, className: 'w-12 min-w-12 px-2 text-center', headerClassName: 'w-12 min-w-12 px-2 text-center', sticky: 'left' },
            {
              id: 'asset',
              header: 'Asset',
              sortable: true,
              accessor: (item) => item.fileName,
              cell: (item) => (
                <div className="flex items-center gap-3">
                  {item.fileType === 'image' && item.storageScope === 'public' ? (
                    <img
                      src={item.thumbnailUrl ?? item.fileUrl}
                      alt={item.altText ?? item.fileName}
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <ImageIcon className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{item.title ?? item.fileName}</p>
                    <p className="text-sm text-muted-foreground">{item.originalName}</p>
                  </div>
                </div>
              ),
            },
            {
              id: 'location',
              header: 'Location',
              accessor: (item) => item.folderName ?? item.storageScope,
              cell: (item) => (
                <div>
                  <p>{item.folderName ?? 'Root'}</p>
                  <p className="text-sm text-muted-foreground">{item.storageScope}</p>
                </div>
              ),
            },
            {
              id: 'type',
              header: 'Type',
              accessor: (item) => item.fileType,
              cell: (item) => (
                <div>
                  <p className="capitalize">{item.fileType}</p>
                  <p className="text-sm text-muted-foreground">{item.mimeType}</p>
                </div>
              ),
            },
            {
              id: 'usage',
              header: 'Usage',
              accessor: (item) => item.usageCount,
              cell: (item) => (
                <div className="flex gap-2">
                  <Badge variant="outline">{item.tagCount} tags</Badge>
                  <Badge variant="outline">{item.usageCount} uses</Badge>
                  <Badge variant="outline">{item.versionCount} versions</Badge>
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              accessor: (item) => item.isActive,
              cell: (item) => (
                <div className="flex items-center gap-2">
                  <ActiveStatusBadge isActive={item.isActive} />
                  {item.isOptimized ? <StatusBadge tone="optimized">Optimized</StatusBadge> : null}
                </div>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              className: 'w-12 min-w-12 px-2 text-center',
              headerClassName: 'w-12 min-w-12 px-2 text-center',
              sticky: 'right',
              cell: (item) => (
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon-sm" variant="ghost">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/dashboard/media/${item.id}/edit`}>
                          <EditIcon className="size-4" />
                          <span>Edit</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void handleToggleActive(item)}>
                        <PowerIcon className="size-4" />
                        <span>{item.isActive ? 'Deactivate' : 'Restore'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            },
          ],
          data: paginatedItems,
          loading,
          loadingMessage: 'Loading media assets...',
          emptyMessage: errorMessage ?? 'No media assets found.',
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>Total records: <span className="font-medium text-foreground">{totalRecords}</span></span>
              <span>Public assets: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.storageScope === 'public').length}</span></span>
              <span>Private assets: <span className="font-medium text-foreground">{filteredItems.filter((item) => item.storageScope === 'private').length}</span></span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          onPageChange: setCurrentPage,
          onPageSizeChange: (value) => {
            setPageSize(value)
            setCurrentPage(1)
          },
        }}
      />
    </div>
  )
}

