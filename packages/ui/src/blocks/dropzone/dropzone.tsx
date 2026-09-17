import { CloudUpload, FileCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'
import { DropzoneFileItem, formatBytes } from './dropzone-file-item'
import type { DropzoneProps } from './dropzone-types'

function validateFile(
  file: File,
  accept?: readonly string[],
  maxSizeBytes?: number,
): string | null {
  if (maxSizeBytes && file.size > maxSizeBytes) {
    return `File exceeds max size of ${formatBytes(maxSizeBytes)}`
  }

  if (accept && accept.length > 0) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const mime = file.type.toLowerCase()
    const isAccepted = accept.some((pattern) => {
      const p = pattern.toLowerCase().trim()
      if (p.startsWith('.')) return ext === p
      if (p.endsWith('/*')) return mime.startsWith(p.replace('/*', '/'))
      return mime === p
    })
    if (!isAccepted) {
      return `File type not supported (expected ${accept.join(', ')})`
    }
  }

  return null
}

export function Dropzone({
  accept,
  allowMultiple = true,
  ariaLabel = 'File upload dropzone',
  className,
  disabled = false,
  emptyMessage = 'No files staged for upload',
  files = [],
  hint,
  maxFiles,
  maxSizeBytes,
  onClearFiles,
  onFilesDrop,
  onRemoveFile,
  onRetryFile,
  showFileList = true,
  title = 'Drag and drop files here, or click to browse',
}: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleProcessFiles(incomingFiles: FileList | File[]) {
    if (disabled) return
    const fileArray = Array.from(incomingFiles)
    const accepted: File[] = []
    const rejected: { error: string; file: File }[] = []

    for (const f of fileArray) {
      if (maxFiles && files.length + accepted.length >= maxFiles) {
        rejected.push({ error: `Exceeds max allowed file limit of ${maxFiles}`, file: f })
        continue
      }
      const err = validateFile(f, accept, maxSizeBytes)
      if (err) {
        rejected.push({ error: err, file: f })
      } else {
        accepted.push(f)
      }
    }

    onFilesDrop?.(accepted, rejected)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isDragActive) {
      setIsDragActive(true)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (disabled || !e.dataTransfer.files) return
    handleProcessFiles(e.dataTransfer.files)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      handleProcessFiles(e.target.files)
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function handleBrowseClick() {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        aria-disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 p-8 text-center transition-all cursor-pointer select-none',
          isDragActive && 'border-primary bg-primary/5 ring-4 ring-primary/10',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'hover:border-foreground/30 hover:bg-muted/30',
        )}
        role="region"
        tabIndex={disabled ? -1 : 0}
        onClick={handleBrowseClick}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault()
            handleBrowseClick()
          }
        }}
      >
        <input
          accept={accept?.join(',')}
          className="sr-only"
          disabled={disabled}
          multiple={allowMultiple}
          ref={inputRef}
          type="file"
          onChange={handleInputChange}
        />

        <div
          className={cn(
            'flex size-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground transition-transform duration-200 group-hover:scale-105',
            isDragActive && 'scale-110 bg-primary/15 text-primary',
          )}
        >
          <CloudUpload className="size-6" />
        </div>

        <h4 className="mt-3 text-sm font-semibold tracking-tight text-foreground">{title}</h4>

        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          {hint ??
            `Supports ${accept ? accept.join(', ') : 'any files'}${
              maxSizeBytes ? ` up to ${formatBytes(maxSizeBytes)}` : ''
            }`}
        </p>

        <Button
          className="mt-4 pointer-events-none"
          disabled={disabled}
          size="sm"
          variant="secondary"
        >
          Select from device
        </Button>
      </div>

      {showFileList && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <FileCheck className="size-3.5 text-muted-foreground" />
              Staged files ({files.length}
              {maxFiles ? ` / ${maxFiles}` : ''})
            </span>

            {files.length > 0 && onClearFiles && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                type="button"
                onClick={onClearFiles}
              >
                Clear all
              </button>
            )}
          </div>

          {files.length > 0 ? (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <DropzoneFileItem
                  file={file}
                  key={file.id}
                  onRemove={onRemoveFile}
                  onRetry={onRetryFile}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 py-4 text-center text-xs text-muted-foreground/70">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
