import { useState } from 'react'
import { Dropzone, type DropzoneFile } from '@codexsun/ui/blocks/dropzone'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const initialFiles: readonly DropzoneFile[] = [
  {
    id: 'file-1',
    name: 'quarterly-report.pdf',
    sizeBytes: 1024 * 1024 * 3.2,
    status: 'complete',
    type: 'application/pdf',
  },
  {
    errorMessage: 'Upload timed out. Check network connection.',
    id: 'file-2',
    name: 'system-dump.tar.gz',
    sizeBytes: 1024 * 1024 * 12.8,
    status: 'error',
    type: 'application/gzip',
  },
  {
    id: 'file-3',
    name: 'brand-logo.svg',
    progress: 72,
    sizeBytes: 1024 * 145,
    status: 'uploading',
    type: 'image/svg+xml',
  },
]

const dropzoneCode = `import { useState } from 'react'
import { Dropzone, type DropzoneFile } from '@codexsun/ui/blocks/dropzone'

export function AssetUploader() {
  const [files, setFiles] = useState<readonly DropzoneFile[]>(stagedFiles)

  function handleDrop(accepted: File[], rejected: { error: string; file: File }[]) {
    const newItems: DropzoneFile[] = accepted.map((f) => ({
      id: String(Date.now() + Math.random()),
      name: f.name,
      sizeBytes: f.size,
      status: 'idle',
      type: f.type,
      file: f,
    }))
    setFiles((prev) => [...prev, ...newItems])
  }

  return (
    <Dropzone
      accept={['.pdf', '.png', '.svg', '.json']}
      files={files}
      maxSizeBytes={10 * 1024 * 1024}
      onFilesDrop={handleDrop}
      onRemoveFile={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
    />
  )
}`

export function UiDropzoneDocumentation() {
  const topology = useMdiTopology()
  const [files, setFiles] = useState<readonly DropzoneFile[]>(initialFiles)
  const [feedback, setFeedback] = useState('Dropzone ready. Supports drag and drop or browsing.')

  function handleFilesDrop(accepted: File[], rejected: { error: string; file: File }[]) {
    const newItems: DropzoneFile[] = accepted.map((f) => ({
      file: f,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      progress: 100,
      sizeBytes: f.size,
      status: 'complete' as const,
      type: f.type,
    }))

    const rejectedItems: DropzoneFile[] = rejected.map((r) => ({
      errorMessage: r.error,
      file: r.file,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: r.file.name,
      sizeBytes: r.file.size,
      status: 'error' as const,
      type: r.file.type,
    }))

    setFiles((prev) => [...prev, ...newItems, ...rejectedItems])
    setFeedback(`Staged ${accepted.length} accepted file(s), ${rejected.length} rejected file(s).`)
  }

  function handleRemoveFile(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
    setFeedback('File removed from staged list.')
  }

  function handleRetryFile(fileId: string) {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, errorMessage: undefined, progress: 50, status: 'uploading' } : f)),
    )
    setFeedback('Retrying upload...')
  }

  return (
    <UiTemplatePage
      code={dropzoneCode}
      importPath="@codexsun/ui/blocks/dropzone"
      kind="Block"
      name="File Dropzone"
      navigation={{
        next: { href: '/?block=filter-builder', name: 'Filter Builder' },
        previous: { href: '/?block=file-tree', name: 'File Tree' },
      }}
      preview={
        <div className="flex flex-col gap-3">
          <div className="w-full max-w-lg">
            <Dropzone
              accept={['.pdf', '.svg', '.png', '.jpg', '.tar.gz', '.json']}
              files={files}
              maxFiles={6}
              maxSizeBytes={15 * 1024 * 1024}
              onClearFiles={() => setFiles([])}
              onFilesDrop={handleFilesDrop}
              onRemoveFile={handleRemoveFile}
              onRetryFile={handleRetryFile}
            />
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {feedback}
          </p>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '26', preview: '26.1', usage: '26.2' }}
      usageDescription={
        <p>
          Supply file upload constraints and storage destination. The Dropzone block owns drag-and-drop
          target interactions, file type validation, size checking, staged list layout, progress bars,
          and file removal.
        </p>
      }
    />
  )
}
