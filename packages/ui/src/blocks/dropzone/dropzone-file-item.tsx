import { AlertCircle, CheckCircle2, File, RefreshCw, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { DropzoneFile } from './dropzone-types'

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function DropzoneFileItem({
  file,
  onRemove,
  onRetry,
}: {
  file: DropzoneFile
  onRemove?: (id: string) => void
  onRetry?: (id: string) => void
}) {
  const isUploading = file.status === 'uploading'
  const isComplete = file.status === 'complete'
  const isError = file.status === 'error'

  return (
    <div
      className={cn(
        'group flex flex-col gap-1.5 rounded-xl border border-border/80 bg-card p-3 shadow-2xs transition-colors',
        isError && 'border-destructive/40 bg-destructive/5',
        isComplete && 'border-emerald-500/30 bg-emerald-500/5',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {file.previewUrl ? (
            <img
              alt={file.name}
              className="size-8 rounded-lg object-cover ring-1 ring-border"
              src={file.previewUrl}
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <File className="size-4" />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">{formatBytes(file.sizeBytes)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isComplete && (
            <span title="Upload complete">
              <CheckCircle2 className="size-4 text-emerald-500" />
            </span>
          )}

          {isError && (
            <>
              <span title="Upload failed">
                <AlertCircle className="size-4 text-destructive" />
              </span>
              {onRetry && (
                <button
                  aria-label="Retry upload"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  type="button"
                  onClick={() => onRetry(file.id)}
                >
                  <RefreshCw className="size-3.5" />
                </button>
              )}
            </>
          )}

          {onRemove && (
            <button
              aria-label={`Remove ${file.name}`}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              type="button"
              onClick={() => onRemove(file.id)}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {isUploading && (
        <div
          aria-label={`Uploading ${file.name}`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={file.progress ?? 0}
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, file.progress ?? 0))}%` }}
          />
        </div>
      )}

      {isError && file.errorMessage && (
        <p className="text-[11px] font-medium text-destructive">{file.errorMessage}</p>
      )}
    </div>
  )
}
