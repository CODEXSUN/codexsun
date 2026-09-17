import type { ReactNode } from 'react'

export interface FileTreeNode {
  children?: readonly FileTreeNode[]
  extension?: string
  id: string
  isExpanded?: boolean
  isLoading?: boolean
  metadata?: Record<string, unknown>
  name: string
  path: string
  sizeBytes?: number
  type: 'file' | 'directory'
}

export interface FileTreeProps {
  allowCreate?: boolean
  allowDelete?: boolean
  ariaLabel?: string
  className?: string
  defaultExpandedIds?: readonly string[]
  emptyMessage?: string
  nodes: readonly FileTreeNode[]
  onCreateFile?: (parentPath: string) => void
  onCreateFolder?: (parentPath: string) => void
  onDeleteNode?: (node: FileTreeNode) => void
  onExpandChange?: (node: FileTreeNode, isExpanded: boolean) => void
  onSelectNode?: (node: FileTreeNode) => void
  renderNodeActions?: (node: FileTreeNode) => ReactNode
  searchPlaceholder?: string
  selectedNodeId?: string | null
  showFilter?: boolean
}
