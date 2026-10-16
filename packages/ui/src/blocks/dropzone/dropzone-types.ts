export type DropzoneFileStatus = 'idle' | 'uploading' | 'complete' | 'error'

export interface DropzoneFile {
  errorMessage?: string | undefined
  file?: File | undefined
  id: string
  name: string
  previewUrl?: string | undefined
  progress?: number | undefined
  sizeBytes: number
  status: DropzoneFileStatus
  type: string
}

export interface DropzoneProps {
  accept?: readonly string[] | undefined
  allowMultiple?: boolean | undefined
  ariaLabel?: string | undefined
  className?: string | undefined
  disabled?: boolean | undefined
  emptyMessage?: string | undefined
  files?: readonly DropzoneFile[] | undefined
  hint?: string | undefined
  maxFiles?: number | undefined
  maxSizeBytes?: number | undefined
  onClearFiles?: (() => void) | undefined
  onFilesDrop?: (acceptedFiles: File[], rejectedFiles: { error: string; file: File }[]) => void
  onRemoveFile?: ((fileId: string) => void) | undefined
  onRetryFile?: ((fileId: string) => void) | undefined
  showFileList?: boolean | undefined
  title?: string | undefined
}
