import type { ReactNode } from 'react'

export interface FileTreeNode {
  children?: readonly FileTreeNode[] | undefined
  extension?: string | undefined
  id: string
  isExpanded?: boolean | undefined
  isLoading?: boolean | undefined
  metadata?: Record<string, unknown> | undefined
  name: string
  path: string
  sizeBytes?: number | undefined
  type: 'file' | 'directory'
}

export interface FileTreeProps {
  allowCreate?: boolean | undefined
  allowDelete?: boolean | undefined
  ariaLabel?: string | undefined
  className?: string | undefined
  defaultExpandedIds?: readonly string[] | undefined
  emptyMessage?: string | undefined
  nodes: readonly FileTreeNode[]
  onCreateFile?: ((parentPath: string) => void) | undefined
  onCreateFolder?: ((parentPath: string) => void) | undefined
  onDeleteNode?: ((node: FileTreeNode) => void) | undefined
  onExpandChange?: ((node: FileTreeNode, isExpanded: boolean) => void) | undefined
  onSelectNode?: ((node: FileTreeNode) => void) | undefined
  renderNodeActions?: ((node: FileTreeNode) => ReactNode) | undefined
  searchPlaceholder?: string | undefined
  selectedNodeId?: string | null | undefined
  showFilter?: boolean | undefined
}
