import { randomUUID } from 'node:crypto'
import type {
  RegistryNode,
  RegistryProfile,
  RegistryProfileSection,
} from '@codexsun/devkit-contracts'
import { ProjectRegistryRepository } from './project-registry.repository.js'

type NodeCreate = Pick<RegistryNode, 'kind' | 'summary' | 'title'> & { parentId: string }
type NodeUpdate = Pick<RegistryNode, 'enabled' | 'key' | 'status' | 'summary' | 'title'>
type ProfileEntry = RegistryProfile[RegistryProfileSection][number]

export class ProjectRegistryService {
  public constructor(private readonly repository: ProjectRegistryRepository) {}

  public async getRegistry() {
    const file = await this.repository.read()
    const changed = ensureInitialSpine(file.root)
    if (changed) {
      file.updatedAt = new Date().toISOString()
      await this.repository.write(file)
    }
    return { generatedAt: file.updatedAt, root: file.root }
  }

  public async createNode(input: NodeCreate) {
    const file = await this.repository.read()
    const parent = findNode(file.root, input.parentId)
    if (!parent || !canContain(parent.kind, input.kind)) return undefined
    const node = createNode(input)
    parent.children.push(node)
    return this.persist(file, node)
  }

  public async updateNode(id: string, input: NodeUpdate) {
    const file = await this.repository.read()
    const node = findNode(file.root, id)
    if (!node) return undefined
    Object.assign(node, input)
    return this.persist(file, node)
  }

  public async confirm(id: string, confirmation: Exclude<RegistryNode['confirmation'], 'pending'>) {
    const file = await this.repository.read()
    const node = findNode(file.root, id)
    if (!node) return undefined
    node.confirmation = confirmation
    return this.persist(file, node)
  }

  public async upsertProfileEntry(
    id: string,
    section: RegistryProfileSection,
    input: Omit<ProfileEntry, 'id'> & { id?: string },
  ) {
    const file = await this.repository.read()
    const node = findNode(file.root, id)
    if (!node || node.kind !== 'module') return undefined
    const entries = node.profile[section]
    const entryId = input.id ?? `${section}-${randomUUID()}`
    const replacement: ProfileEntry = { ...input, id: entryId }
    const index = entries.findIndex((entry) => entry.id === entryId)
    if (index < 0) entries.push(replacement)
    else entries[index] = replacement
    return this.persist(file, node)
  }

  private async persist(file: { root: RegistryNode; updatedAt: string }, node: RegistryNode) {
    file.updatedAt = new Date().toISOString()
    await this.repository.write(file)
    return { node, updatedAt: file.updatedAt }
  }
}

function ensureInitialSpine(root: RegistryNode): boolean {
  let changed = false
  const app = ensureChild(
    root,
    'app',
    'devkit',
    'DevKit',
    'DevKit development application.',
    () => {
      changed = true
    },
  )
  const group = ensureChild(
    app,
    'module-group',
    'identity',
    'Identity',
    'Authentication and user identity capabilities.',
    () => {
      changed = true
    },
  )
  const accessControl = ensureChild(
    group,
    'submodule-group',
    'access-control',
    'Access control',
    'Identity access-control planning modules.',
    () => {
      changed = true
    },
  )
  if (migrateUserEndpoint(group, accessControl)) changed = true
  const user = ensureChild(
    accessControl,
    'module',
    'user',
    'User',
    'User identity and account lifecycle module.',
    () => {
      changed = true
    },
  )
  if (ensureProfile(user, userProfile)) changed = true
  for (const module of accessModules) {
    const node = ensureChild(
      accessControl,
      'module',
      module.key,
      module.title,
      module.summary,
      () => {
        changed = true
      },
    )
    if (ensureProfile(node, module.profile)) changed = true
  }
  return changed
}

function migrateUserEndpoint(parent: RegistryNode, target: RegistryNode): boolean {
  const user = parent.children.find((child) => child.key === 'user')
  if (!user || target.children.some((child) => child.key === 'user')) return false
  const endpoint = user.children.find((child) => child.key === 'user-endpoint')
  if (endpoint) mergeProfile(user, endpoint.profile)
  user.children = user.children.filter((child) => child.key !== 'user-endpoint')
  user.kind = 'module'
  user.summary = 'User identity and account lifecycle module.'
  parent.children = parent.children.filter((child) => child.id !== user.id)
  target.children.push(user)
  return true
}

function ensureChild(
  parent: RegistryNode,
  kind: RegistryNode['kind'],
  key: string,
  title: string,
  summary: string,
  onCreate: () => void,
): RegistryNode {
  const existing = parent.children.find((child) => child.key === key)
  if (existing) {
    if (existing.kind !== kind) {
      existing.kind = kind
      onCreate()
    }
    return existing
  }
  const node = createNode({ kind, parentId: parent.id, summary, title }, key)
  parent.children.push(node)
  onCreate()
  return node
}

function createNode(input: NodeCreate, key = toKey(input.title)): RegistryNode {
  return {
    children: [],
    confirmation: 'pending',
    enabled: true,
    id: `${input.kind}-${randomUUID()}`,
    key,
    kind: input.kind,
    profile: emptyProfile(),
    status: 'planned',
    summary: input.summary,
    title: input.title,
  }
}

function emptyProfile(): RegistryProfile {
  return { actions: [], database: [], events: [], files: [], info: [], planning: [], routes: [] }
}

function ensureProfile(
  node: RegistryNode,
  profile: Record<RegistryProfileSection, readonly ProfileEntry[]>,
): boolean {
  let changed = false
  for (const [section, entries] of Object.entries(profile) as [
    RegistryProfileSection,
    readonly ProfileEntry[],
  ][]) {
    for (const entry of entries) {
      const existing = node.profile[section].find(
        (item) => item.id === entry.id || item.key === entry.key,
      )
      if (existing) continue
      node.profile[section].push({ ...entry })
      changed = true
    }
  }
  return changed
}

function mergeProfile(target: RegistryNode, source: RegistryProfile): void {
  for (const section of Object.keys(source) as RegistryProfileSection[]) {
    for (const entry of source[section]) {
      if (!target.profile[section].some((item) => item.id === entry.id || item.key === entry.key))
        target.profile[section].push({ ...entry })
    }
  }
}

const userProfile: Record<RegistryProfileSection, readonly ProfileEntry[]> = {
  actions: [
    {
      id: 'action-create-or-update',
      key: 'Create or update',
      value: 'Persist the user identity record after validation.',
    },
    {
      id: 'action-deactivate',
      key: 'Deactivate',
      value: 'Disable access without deleting the user history.',
    },
    {
      id: 'action-reset-access',
      key: 'Reset access',
      value: 'Start a controlled password or access-recovery flow.',
    },
  ],
  database: [
    { id: 'database-table', key: 'Table', value: 'identity_users' },
    { id: 'database-primary-key', key: 'Primary key', value: 'id: uuid, required' },
    { id: 'database-email', key: 'Email', value: 'email: varchar(254), unique, required' },
    { id: 'database-status', key: 'Status', value: 'status: active | suspended | invited' },
  ],
  events: [
    { id: 'event-user-changed', key: 'User changed', value: 'identity.user.changed' },
    { id: 'event-user-deactivated', key: 'User deactivated', value: 'identity.user.deactivated' },
    { id: 'event-audit', key: 'Audit rule', value: 'Record actor, timestamp, and changed fields.' },
  ],
  files: [
    { id: 'file-api', key: 'API module', value: 'apps/devkit/api/src/modules/project-registry/' },
    { id: 'file-contracts', key: 'Contracts', value: 'apps/devkit/contracts/src/index.ts' },
    {
      id: 'file-web',
      key: 'Web workspace',
      value: 'apps/devkit/web/src/modules/project-registry/',
    },
  ],
  info: [
    { id: 'info-owner', key: 'Owner', value: 'Identity team' },
    { id: 'info-classification', key: 'Classification', value: 'Personal identity data' },
    { id: 'info-authentication', key: 'Authentication', value: 'Bearer access token required' },
    {
      id: 'info-audit-trail',
      key: 'Audit trail',
      value: 'Create, update, and deactivate activity',
    },
    { id: 'info-rate-limit', key: 'Rate limit', value: '60 requests per minute' },
    { id: 'info-response', key: 'Response format', value: 'JSON user profile object' },
  ],
  planning: [
    { id: 'planning-user-read', key: 'Get user', value: 'GET /identity/users/:id' },
    {
      id: 'planning-authorisation',
      key: 'Authorisation',
      value: 'Only permitted actors can read or change a user.',
    },
    {
      id: 'planning-validation',
      key: 'Validation',
      value: 'Validate identity input at the API boundary with Zod.',
    },
  ],
  routes: [
    { id: 'route-list-users', key: 'List users', value: 'GET /identity/users' },
    { id: 'route-get-user', key: 'Get user', value: 'GET /identity/users/:id' },
    { id: 'route-create-user', key: 'Create user', value: 'POST /identity/users' },
    { id: 'route-update-user', key: 'Update user', value: 'PUT /identity/users/:id' },
    {
      id: 'route-deactivate-user',
      key: 'Deactivate user',
      value: 'POST /identity/users/:id/deactivate',
    },
  ],
}

type AccessModule = {
  key: string
  profile: Record<RegistryProfileSection, readonly ProfileEntry[]>
  summary: string
  title: string
}

const accessModules: readonly AccessModule[] = [
  createAccessModule(
    'role',
    'Role',
    'Named access roles for the identity workspace.',
    'identity_roles',
  ),
  createAccessModule(
    'permission',
    'Permission',
    'Named capability permissions for access control.',
    'identity_permissions',
  ),
  createAccessModule(
    'user-role',
    'User role',
    'User-to-role access assignments.',
    'identity_user_roles',
  ),
  createAccessModule(
    'role-permission',
    'Role permission',
    'Role-to-permission access assignments.',
    'identity_role_permissions',
  ),
]

function createAccessModule(
  key: string,
  title: string,
  summary: string,
  table: string,
): AccessModule {
  const path = `/identity/${key}s`
  return {
    key,
    summary,
    title,
    profile: {
      actions: [
        { id: `${key}-action-save`, key: 'Create or update', value: `Save the ${title} record.` },
        {
          id: `${key}-action-disable`,
          key: 'Disable',
          value: `Disable the ${title} record safely.`,
        },
      ],
      database: [
        { id: `${key}-database-table`, key: 'Table', value: table },
        { id: `${key}-database-primary-key`, key: 'Primary key', value: 'id: uuid, required' },
      ],
      events: [{ id: `${key}-event-changed`, key: 'Changed', value: `identity.${key}.changed` }],
      files: [
        {
          id: `${key}-file-module`,
          key: 'Planning module',
          value: 'apps/devkit/api/src/modules/project-registry/',
        },
      ],
      info: [
        { id: `${key}-info-owner`, key: 'Owner', value: 'Identity team' },
        { id: `${key}-info-purpose`, key: 'Purpose', value: summary },
      ],
      planning: [
        {
          id: `${key}-planning-authorisation`,
          key: 'Authorisation',
          value: 'Require a permitted actor for every change.',
        },
      ],
      routes: [
        { id: `${key}-route-list`, key: `List ${title}s`, value: `GET ${path}` },
        { id: `${key}-route-save`, key: `Save ${title}`, value: `POST ${path}` },
      ],
    },
  }
}

function canContain(parent: RegistryNode['kind'], child: RegistryNode['kind']): boolean {
  return (
    (parent === 'project' && child === 'app') ||
    (parent === 'app' && child === 'module-group') ||
    (parent === 'module-group' && child === 'submodule-group') ||
    (parent === 'submodule-group' && child === 'module')
  )
}

function findNode(node: RegistryNode, id: string): RegistryNode | undefined {
  if (node.id === id) return node
  return node.children.map((child) => findNode(child, id)).find(Boolean)
}

function toKey(value: string): string {
  return (
    value
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'item'
  )
}
