import { useState } from 'react'
import { FileTree, type FileTreeNode } from '@codexsun/ui/blocks/file-tree'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleTreeNodes: readonly FileTreeNode[] = [
  {
    children: [
      {
        children: [
          { id: 'app-ts', name: 'app.ts', path: 'apps/platform/api/src/app.ts', type: 'file' },
          { id: 'server-ts', name: 'server.ts', path: 'apps/platform/api/src/server.ts', type: 'file' },
          { id: 'config-ts', name: 'config.ts', path: 'apps/platform/api/src/config.ts', type: 'file' },
          {
            children: [
              { id: 'id-mod', name: 'identity.module.ts', path: 'apps/platform/api/src/modules/identity.module.ts', type: 'file' },
              { id: 'sys-mod', name: 'system.module.ts', path: 'apps/platform/api/src/modules/system.module.ts', type: 'file' },
            ],
            id: 'modules-dir',
            name: 'modules',
            path: 'apps/platform/api/src/modules',
            type: 'directory',
          },
        ],
        id: 'api-src',
        name: 'src',
        path: 'apps/platform/api/src',
        type: 'directory',
      },
      { id: 'api-pkg', name: 'package.json', path: 'apps/platform/api/package.json', type: 'file' },
      { id: 'api-readme', name: 'README.md', path: 'apps/platform/api/README.md', type: 'file' },
    ],
    id: 'platform-api',
    name: 'apps/platform/api',
    path: 'apps/platform/api',
    type: 'directory',
  },
  {
    children: [
      { id: 'ui-index', name: 'index.ts', path: 'packages/ui/src/index.ts', type: 'file' },
      { id: 'ui-css', name: 'globals.css', path: 'packages/ui/src/styles/globals.css', type: 'file' },
      { id: 'ui-pkg', name: 'package.json', path: 'packages/ui/package.json', type: 'file' },
    ],
    id: 'packages-ui',
    name: 'packages/ui',
    path: 'packages/ui',
    type: 'directory',
  },
  { id: 'root-readme', name: 'README.md', path: 'README.md', type: 'file' },
  { id: 'root-agents', name: 'AGENTS.md', path: 'AGENTS.md', type: 'file' },
  { id: 'root-pkg', name: 'package.json', path: 'package.json', type: 'file' },
]

const fileTreeCode = `import { useState } from 'react'
import { FileTree, type FileTreeNode } from '@codexsun/ui/blocks/file-tree'

export function WorkspaceExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>('app-ts')

  return (
    <FileTree
      allowCreate
      allowDelete
      defaultExpandedIds={['platform-api', 'api-src']}
      nodes={workspaceNodes}
      selectedNodeId={selectedId}
      onSelectNode={(node) => setSelectedId(node.id)}
      onCreateFile={(path) => console.log('Create file at', path)}
    />
  )
}`

export function UiFileTreeDocumentation() {
  const topology = useMdiTopology()
  const [selectedId, setSelectedId] = useState<string | null>('app-ts')
  const [feedback, setFeedback] = useState('Selected: apps/platform/api/src/app.ts')

  function handleSelectNode(node: FileTreeNode) {
    setSelectedId(node.id)
    setFeedback(`Selected ${node.type}: ${node.path}`)
  }

  return (
    <UiTemplatePage
      code={fileTreeCode}
      importPath="@codexsun/ui/blocks/file-tree"
      kind="Block"
      name="File Tree"
      navigation={{
        next: { href: '/?block=dropzone', name: 'File Dropzone' },
        previous: { href: '/?block=kanban', name: 'Kanban Board' },
      }}
      preview={
        <div className="flex flex-col gap-3">
          <div className="w-full max-w-lg">
            <FileTree
              allowCreate
              allowDelete
              defaultExpandedIds={['platform-api', 'api-src', 'packages-ui']}
              nodes={sampleTreeNodes}
              onCreateFile={(p) => setFeedback(`New file requested in ${p}`)}
              onCreateFolder={(p) => setFeedback(`New folder requested in ${p}`)}
              onDeleteNode={(n) => setFeedback(`Delete requested: ${n.name}`)}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedId}
            />
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {feedback}
          </p>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '25', preview: '25.1', usage: '25.2' }}
      usageDescription={
        <p>
          Supply workspace or vault node hierarchies. The File Tree block manages recursive node
          rendering, extension-based file type icons, folder expand/collapse state, filter queries,
          and inline creation/deletion actions.
        </p>
      }
    />
  )
}
