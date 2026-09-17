export type DropzoneFileStatus = 'idle' | 'uploading' | 'complete' | 'error'

export interface DropzoneFile {
  errorMessage?: string
  file?: File
  id: string
  name: string
  previewUrl?: string
  progress?: number
  sizeBytes: number
  status: DropzoneFileStatus
  type: string
}

export interface DropzoneProps {
  accept?: readonly string[]
  allowMultiple?: boolean
  ariaLabel?: string
  className?: string
  disabled?: boolean
  emptyMessage?: string
  files?: readonly DropzoneFile[]
  hint?: string
  maxFiles?: number
  maxSizeBytes?: number
  onClearFiles?: () => void
  onFilesDrop?: (acceptedFiles: File[], rejectedFiles: { error: string; file: File }[]) => void
  onRemoveFile?: (fileId: string) => void
  onRetryFile?: (fileId: string) => void
  showFileList?: boolean
  title?: string
}
