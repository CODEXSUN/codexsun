import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import {
  registryNodeSchema,
  type RegistryNode,
  type RegistryProfile,
} from '@codexsun/devkit-contracts'
import type { ProjectRegistryFile } from './project-registry.types.js'

export class ProjectRegistryRepository {
  public constructor(private readonly path: string) {}

  public async read(): Promise<ProjectRegistryFile> {
    try {
      const raw = JSON.parse(await readFile(this.path, 'utf8')) as unknown
      const file = migrateRegistry(raw)
      await this.write(file)
      return file
    } catch (error: unknown) {
      if (!isMissingFile(error)) throw error
      const initial = { root: projectRegistrySeed, updatedAt: new Date().toISOString() }
      await this.write(initial)
      return initial
    }
  }

  public async write(file: ProjectRegistryFile): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    await writeFile(this.path, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
  }
}

function migrateRegistry(raw: unknown): ProjectRegistryFile {
  const source = raw as { root?: unknown; updatedAt?: unknown }
  return {
    root: normalizeNode(source.root, true),
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : new Date().toISOString(),
  }
}

function normalizeNode(value: unknown, isRoot = false): RegistryNode {
  const source = value as Partial<RegistryNode> & { children?: unknown; kind?: string }
  const title =
    typeof source.title === 'string' && source.title.trim()
      ? source.title
      : 'Untitled registry item'
  const children = Array.isArray(source.children)
    ? source.children.map((child) => normalizeNode(child))
    : []
  return registryNodeSchema.parse({
    children,
    confirmation: source.confirmation ?? 'pending',
    enabled: source.enabled ?? true,
    id: typeof source.id === 'string' ? source.id : slugify(title),
    key: typeof source.key === 'string' ? source.key : slugify(title),
    kind: normalizeKind(source.kind, isRoot, children.length),
    profile: normalizeProfile(source.profile),
    status: source.status ?? 'planned',
    summary:
      typeof source.summary === 'string' && source.summary.trim()
        ? source.summary
        : 'No description recorded.',
    title,
  })
}

function normalizeKind(
  kind: string | undefined,
  isRoot: boolean,
  childCount: number,
): RegistryNode['kind'] {
  if (isRoot) return 'project'
  if (kind === 'submodule') return childCount ? 'submodule-group' : 'module'
  if (kind === 'module' && childCount) return 'submodule-group'
  if (kind === 'app' || kind === 'module-group' || kind === 'module' || kind === 'submodule-group')
    return kind
  return 'app'
}

function normalizeProfile(value: unknown): RegistryProfile {
  const source = (value ?? {}) as Partial<RegistryProfile>
  return {
    actions: normalizeEntries(source.actions),
    database: normalizeEntries(source.database),
    events: normalizeEntries(source.events),
    files: normalizeEntries(source.files),
    info: normalizeEntries(source.info),
    planning: normalizeEntries(source.planning),
    routes: normalizeEntries(source.routes),
  }
}

function normalizeEntries(value: unknown) {
  return Array.isArray(value) ? value : []
}

function slugify(value: string): string {
  return (
    value
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'registry-item'
  )
}

function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}

const emptyProfile: RegistryProfile = {
  actions: [],
  database: [],
  events: [],
  files: [],
  info: [],
  planning: [],
  routes: [],
}

const projectRegistrySeed: RegistryNode = registryNodeSchema.parse({
  children: [],
  confirmation: 'pending',
  enabled: true,
  id: 'codexsun',
  key: 'codexsun',
  kind: 'project',
  profile: emptyProfile,
  status: 'active',
  summary: 'CODEXSUN application and module planning registry.',
  title: 'CODEXSUN',
})
