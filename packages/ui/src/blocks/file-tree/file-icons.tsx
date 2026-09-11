import {
  File,
  FileArchive,
  FileCode,
  FileCode2,
  FileImage,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react'
import { cn } from '../../lib/utils'

export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  if (parts.length <= 1) return ''
  return parts[parts.length - 1].toLowerCase()
}

export function FileTypeIcon({
  className,
  extension,
  isDirectory = false,
  isOpen = false,
}: {
  className?: string
  extension?: string
  isDirectory?: boolean
  isOpen?: boolean
}) {
  if (isDirectory) {
    if (isOpen) {
      return (
        <FolderOpen
          className={cn('size-4 shrink-0 text-amber-500/90 dark:text-amber-400', className)}
        />
      )
    }
    return (
      <Folder
        className={cn('size-4 shrink-0 text-amber-500/90 dark:text-amber-400', className)}
      />
    )
  }

  const ext = extension?.toLowerCase()

  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode2 className={cn('size-4 shrink-0 text-blue-500', className)} />
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return <FileCode2 className={cn('size-4 shrink-0 text-amber-500', className)} />
    case 'json':
      return <FileJson className={cn('size-4 shrink-0 text-amber-600 dark:text-amber-400', className)} />
    case 'md':
    case 'mdx':
    case 'txt':
    case 'doc':
      return <FileText className={cn('size-4 shrink-0 text-emerald-500', className)} />
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return <FileCode className={cn('size-4 shrink-0 text-sky-500', className)} />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage className={cn('size-4 shrink-0 text-violet-500', className)} />
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
      return <FileArchive className={cn('size-4 shrink-0 text-orange-500', className)} />
    default:
      return <File className={cn('size-4 shrink-0 text-muted-foreground', className)} />
  }
}
