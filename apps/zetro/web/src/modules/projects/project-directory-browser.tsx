import { useEffect, useState } from 'react'
import { ArrowUp, Check, Folder } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@codexsun/ui/components/dialog'
import { listProjectDirectories } from './projects.services'
import type { ProjectDirectoryListing } from './projects.types'

export function ProjectDirectoryBrowser({
  onOpenChange,
  onSelect,
  open,
  rootPath,
  startPath,
}: {
  onOpenChange(open: boolean): void
  onSelect(path: string): void
  open: boolean
  rootPath?: string
  startPath: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [listing, setListing] = useState<ProjectDirectoryListing | null>(null)

  useEffect(() => {
    if (open) void load(startPath)
  }, [open, startPath])

  async function load(path: string) {
    setIsLoading(true)
    try {
      setListing(await listProjectDirectories(path))
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Zetro could not open this folder.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Select repository folder</DialogTitle>
          <DialogDescription className="truncate" title={listing?.path ?? startPath}>
            {listing?.path ?? startPath}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 min-h-40 overflow-y-auto border-y py-1">
          {listing?.parentPath && !samePath(listing.path, rootPath) ? (
            <button
              className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-accent"
              onClick={() => void load(listing.parentPath!)}
              type="button"
            >
              <ArrowUp className="size-4 text-muted-foreground" /> Parent folder
            </button>
          ) : null}
          {listing?.directories.map((directory) => (
            <button
              className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-accent"
              key={directory.path}
              onClick={() => void load(directory.path)}
              type="button"
            >
              <Folder className="size-4 text-muted-foreground" />
              <span className="truncate">{directory.name}</span>
            </button>
          ))}
          {isLoading ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Opening folder…</p>
          ) : null}
          {!isLoading && listing?.directories.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No child folders.</p>
          ) : null}
          {error ? <p className="px-2 py-3 text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button
            className="cursor-pointer"
            disabled={!listing || isLoading}
            onClick={() => {
              if (!listing) return
              onSelect(listing.path)
              onOpenChange(false)
            }}
          >
            <Check /> Use this folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function samePath(path: string, rootPath?: string) {
  if (!rootPath) return false
  return normalizePath(path) === normalizePath(rootPath)
}

function normalizePath(path: string) {
  return path.replaceAll('\\', '/').replace(/\/$/, '').toLowerCase()
}
