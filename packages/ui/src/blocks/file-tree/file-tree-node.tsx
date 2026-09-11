import { ChevronRight, FilePlus, FolderPlus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { FileTypeIcon, getFileExtension } from './file-icons'
import type { FileTreeNode } from './file-tree-types'

export interface FileTreeNodeProps {
  allowCreate?: boolean
  allowDelete?: boolean
  expandedIds: Set<string>
  level?: number
  node: FileTreeNode
  onCreateFile?: (parentPath: string) => void
  onCreateFolder?: (parentPath: string) => void
  onDeleteNode?: (node: FileTreeNode) => void
  onSelectNode?: (node: FileTreeNode) => void
  onToggleExpand: (node: FileTreeNode) => void
  renderActions?: (node: FileTreeNode) => ReactNode
  selectedNodeId?: string | null
}

export function FileTreeNodeComponent({
  allowCreate = false,
  allowDelete = false,
  expandedIds,
  level = 0,
  node,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onSelectNode,
  onToggleExpand,
  renderActions,
  selectedNodeId,
}: FileTreeNodeProps) {
  const isDirectory = node.type === 'directory'
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedNodeId === node.id
  const ext = node.extension ?? getFileExtension(node.name)

  function handleClick() {
    if (isDirectory) {
      onToggleExpand(node)
    }
    onSelectNode?.(node)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div className="flex flex-col">
      <div
        aria-expanded={isDirectory ? isExpanded : undefined}
        aria-selected={isSelected}
        className={cn(
          'group relative flex min-h-7.5 cursor-pointer items-center justify-between rounded-lg py-1 pr-2 text-xs font-medium text-foreground transition-colors select-none',
          isSelected
            ? 'bg-primary/10 text-primary font-semibold'
            : 'hover:bg-muted/70 text-foreground/80 hover:text-foreground',
        )}
        role="treeitem"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          {isDirectory ? (
            <span
              className="flex size-4.5 shrink-0 items-center justify-center text-muted-foreground/70 transition-transform duration-150 group-hover:text-foreground"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
            >
              <ChevronRight className="size-3.5" />
            </span>
          ) : (
            <span className="size-4.5 shrink-0" />
          )}

          <FileTypeIcon
            extension={ext}
            isDirectory={isDirectory}
            isOpen={isExpanded}
          />

          <span className="truncate" title={node.path}>
            {node.name}
          </span>
        </div>

        <div
          className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {renderActions?.(node)}

          {isDirectory && allowCreate && (
            <>
              {onCreateFile && (
                <button
                  aria-label={`New file in ${node.name}`}
                  className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                  type="button"
                  onClick={() => onCreateFile(node.path)}
                >
                  <FilePlus className="size-3.5" />
                </button>
              )}
              {onCreateFolder && (
                <button
                  aria-label={`New folder in ${node.name}`}
                  className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                  type="button"
                  onClick={() => onCreateFolder(node.path)}
                >
                  <FolderPlus className="size-3.5" />
                </button>
              )}
            </>
          )}

          {allowDelete && onDeleteNode && (
            <button
              aria-label={`Delete ${node.name}`}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              type="button"
              onClick={() => onDeleteNode(node)}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {isDirectory && isExpanded && node.children && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <FileTreeNodeComponent
              allowCreate={allowCreate}
              allowDelete={allowDelete}
              expandedIds={expandedIds}
              key={child.id}
              level={level + 1}
              node={child}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteNode={onDeleteNode}
              onSelectNode={onSelectNode}
              onToggleExpand={onToggleExpand}
              renderActions={renderActions}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
