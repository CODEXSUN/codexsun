import { ChevronsDownUp, ChevronsUpDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import { FileTreeNodeComponent } from './file-tree-node'
import type { FileTreeNode, FileTreeProps } from './file-tree-types'

function filterNodes(nodes: readonly FileTreeNode[], query: string): FileTreeNode[] {
  const q = query.toLowerCase()
  const result: FileTreeNode[] = []

  for (const node of nodes) {
    if (node.name.toLowerCase().includes(q)) {
      result.push(node)
    } else if (node.type === 'directory' && node.children) {
      const filteredChildren = filterNodes(node.children, query)
      if (filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren,
        })
      }
    }
  }

  return result
}

function getAllDirectoryIds(nodes: readonly FileTreeNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    if (node.type === 'directory') {
      ids.push(node.id)
      if (node.children) {
        ids.push(...getAllDirectoryIds(node.children))
      }
    }
  }
  return ids
}

export function FileTree({
  allowCreate = false,
  allowDelete = false,
  ariaLabel = 'File and workspace tree',
  className,
  defaultExpandedIds = [],
  emptyMessage = 'No files found',
  nodes,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onExpandChange,
  onSelectNode,
  renderNodeActions,
  searchPlaceholder = 'Filter files...',
  selectedNodeId,
  showFilter = true,
}: FileTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds),
  )
  const [searchQuery, setSearchQuery] = useState('')

  const allDirIds = useMemo(() => getAllDirectoryIds(nodes), [nodes])

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes
    return filterNodes(nodes, searchQuery.trim())
  }, [nodes, searchQuery])

  function handleToggleExpand(node: FileTreeNode) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      const isExpanding = !next.has(node.id)
      if (isExpanding) {
        next.add(node.id)
      } else {
        next.delete(node.id)
      }
      onExpandChange?.(node, isExpanding)
      return next
    })
  }

  function handleExpandAll() {
    setExpandedIds(new Set(allDirIds))
  }

  function handleCollapseAll() {
    setExpandedIds(new Set())
  }

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'flex flex-col rounded-2xl border border-border/80 bg-card p-2 text-card-foreground shadow-2xs',
        className,
      )}
      role="tree"
    >
      {showFilter && (
        <div className="mb-2 flex items-center justify-between gap-1.5 border-b border-border/40 pb-2 px-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              aria-label="Filter tree nodes"
              className="h-8 w-full rounded-lg border border-border/60 bg-muted/40 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
              placeholder={searchPlaceholder}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-0.5">
            <button
              aria-label="Expand all folders"
              className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              title="Expand all"
              type="button"
              onClick={handleExpandAll}
            >
              <ChevronsUpDown className="size-3.5" />
            </button>
            <button
              aria-label="Collapse all folders"
              className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              title="Collapse all"
              type="button"
              onClick={handleCollapseAll}
            >
              <ChevronsDownUp className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-24">
        {filteredNodes.length > 0 ? (
          filteredNodes.map((node) => (
            <FileTreeNodeComponent
              allowCreate={allowCreate}
              allowDelete={allowDelete}
              expandedIds={searchQuery.trim() ? new Set(allDirIds) : expandedIds}
              key={node.id}
              node={node}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteNode={onDeleteNode}
              onSelectNode={onSelectNode}
              onToggleExpand={handleToggleExpand}
              renderActions={renderNodeActions}
              selectedNodeId={selectedNodeId}
            />
          ))
        ) : (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}
