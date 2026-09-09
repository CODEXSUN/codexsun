import matter from 'gray-matter'
import { createHash } from 'node:crypto'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import type { DocumentationIssue, DocumentationScanResponse } from '@codexsun/docs-contracts'
import type { DocumentRecord } from './docs-library.types.js'

type FrontMatter = {
  aliases?: unknown
  description?: unknown
  tags?: unknown
  title?: unknown
}

const ignoredDirectories = new Set([
  '.git',
  '.obsidian',
  'coverage',
  'dist',
  'node_modules',
  'storage',
])
const assetContentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
])
const documentExtensions = new Set(['.md', '.mdx', '.txt'])
const organizedRoots = new Set(['.container', 'apps', 'assist', 'packages'])
const rootDocuments = new Set(['agents.md', 'readme.md'])

export type DocsAsset = {
  content: Buffer
  contentType: string
}

export class DocsVault {
  public constructor(
    private readonly vaultPath: string,
    private readonly projectRoot: string,
  ) {}

  public async find(slug: string): Promise<DocumentRecord | undefined> {
    return (await this.list()).find((document) => document.slug === slug)
  }

  public async list(): Promise<DocumentRecord[]> {
    const paths = await this.collectSourcePaths()
    const documents = await Promise.all(paths.map((path) => this.readDocument(path)))
    const slugs = new Set(documents.map((document) => document.slug))

    return documents
      .map((document) => ({ ...document, links: this.resolveLinks(document.source, slugs) }))
      .sort((left, right) => left.title.localeCompare(right.title))
  }

  public async scan(): Promise<DocumentationScanResponse> {
    const documents = await this.list()
    const missingDocumentation = await this.findMissingReadmes()
    const unorganizedFiles = documents
      .filter((document) => this.isUnorganizedDocument(document.path))
      .map((document) => ({
        description: 'Place this source below assist, an application, a package, or .container.',
        kind: 'unorganized-source' as const,
        path: document.path,
      }))

    return {
      missingDocumentation,
      scannedAt: new Date().toISOString(),
      unorganizedFiles,
    }
  }

  public async update(
    document: DocumentRecord,
    input: { source: string; sourceHash: string; title?: string },
  ): Promise<DocumentRecord> {
    if (document.sourceHash !== input.sourceHash) {
      throw new DocsDocumentConflictError()
    }

    const sourcePath = this.resolveDocumentPath(document.path)
    const parsed = matter(await readFile(sourcePath, 'utf8'))
    const metadata = parsed.data as FrontMatter
    if (input.title) metadata.title = input.title
    await writeFile(sourcePath, matter.stringify(input.source, metadata), 'utf8')
    return this.readDocument(sourcePath)
  }

  public async getAsset(assetPath: string): Promise<DocsAsset | undefined> {
    const contentType = assetContentTypes.get(extname(assetPath).toLowerCase())
    if (!contentType) return undefined

    try {
      const sourcePath = this.resolveDocumentPath(assetPath)
      const asset = await stat(sourcePath)
      if (!asset.isFile()) return undefined
      return { content: await readFile(sourcePath), contentType }
    } catch {
      return undefined
    }
  }

  private async collectDocumentPaths(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true })
    const results = await Promise.all(
      entries.map(async (entry) => {
        const path = resolve(directory, entry.name)
        if (entry.isDirectory()) {
          return this.isIgnoredDirectory(entry.name) ? [] : this.collectDocumentPaths(path)
        }

        return documentExtensions.has(extname(entry.name).toLowerCase()) ? [path] : []
      }),
    )

    return results.flat()
  }

  private async collectSourcePaths(): Promise<string[]> {
    const vaultPaths = await this.collectDocumentPaths(this.vaultPath)
    const repositoryPaths = await this.collectDocumentPaths(this.projectRoot)
    return [...new Set([...vaultPaths, ...repositoryPaths])]
  }

  private isIgnoredDirectory(name: string): boolean {
    return ignoredDirectories.has(name)
  }

  private resolveDocumentPath(documentPath: string): string {
    const sourcePath = resolve(this.projectRoot, documentPath)
    const projectRelativePath = relative(this.projectRoot, sourcePath)
    if (isAbsolute(projectRelativePath) || projectRelativePath.startsWith('..')) {
      throw new Error('Document source path is outside the repository.')
    }
    return sourcePath
  }

  private async readDocument(sourcePath: string): Promise<DocumentRecord> {
    const rawSource = await readFile(sourcePath, 'utf8')
    const parsed = matter(rawSource)
    const metadata = parsed.data as FrontMatter
    const fileInfo = await stat(sourcePath)
    const slug = this.toSlug(sourcePath)
    const title =
      this.readText(metadata.title) ?? this.readHeading(parsed.content) ?? this.toTitle(slug)

    return {
      aliases: this.readStringList(metadata.aliases),
      description: this.readText(metadata.description) ?? '',
      links: [],
      slug,
      source: parsed.content,
      sourceHash: createHash('sha256').update(rawSource).digest('hex'),
      path: relative(this.projectRoot, sourcePath).replaceAll(sep, '/'),
      tags: this.readStringList(metadata.tags),
      title,
      updatedAt: fileInfo.mtime.toISOString(),
    }
  }

  private async findMissingReadmes(): Promise<DocumentationIssue[]> {
    const candidates = [
      ...(await this.collectOwnedDirectories(resolve(this.projectRoot, 'apps'))),
      ...(await this.collectModuleDirectories(resolve(this.projectRoot, 'apps'))),
      ...(await this.collectOwnedDirectories(resolve(this.projectRoot, 'packages'))),
    ]
    const missing = await Promise.all(
      candidates.map(async (directory) => {
        try {
          const readme = await stat(resolve(directory, 'README.md'))
          return readme.isFile() ? undefined : this.toMissingReadmeIssue(directory)
        } catch {
          return this.toMissingReadmeIssue(directory)
        }
      }),
    )
    return missing
      .filter((issue): issue is DocumentationIssue => Boolean(issue))
      .sort((left, right) => left.path.localeCompare(right.path))
  }

  private async collectOwnedDirectories(root: string): Promise<string[]> {
    try {
      const entries = await readdir(root, { withFileTypes: true })
      return entries
        .filter((entry) => entry.isDirectory() && !this.isIgnoredDirectory(entry.name))
        .map((entry) => resolve(root, entry.name))
    } catch {
      return []
    }
  }

  private async collectModuleDirectories(appsRoot: string): Promise<string[]> {
    const applications = await this.collectOwnedDirectories(appsRoot)
    const moduleRoots = applications.flatMap((application) => [
      resolve(application, 'api', 'src', 'modules'),
      resolve(application, 'web', 'src', 'modules'),
    ])
    const modules = await Promise.all(moduleRoots.map((root) => this.collectOwnedDirectories(root)))
    return modules.flat()
  }

  private isUnorganizedDocument(documentPath: string): boolean {
    const [root] = documentPath.split('/')
    return !organizedRoots.has(root) && !rootDocuments.has(documentPath.toLowerCase())
  }

  private toMissingReadmeIssue(directory: string): DocumentationIssue {
    const path = relative(this.projectRoot, directory).replaceAll(sep, '/')
    return {
      description: 'Add a README.md that explains this owned source area.',
      kind: 'missing-readme',
      path,
    }
  }

  private readStringList(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : []
  }

  private readText(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
  }

  private resolveLinks(source: string, knownSlugs: Set<string>): string[] {
    return [...source.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)]
      .map((match) => this.normalizeLink(match[1]))
      .filter((slug): slug is string => knownSlugs.has(slug))
  }

  private normalizeLink(value: string): string {
    return value.trim().replaceAll(' ', '-').toLowerCase()
  }

  private toSlug(sourcePath: string): string {
    const root = sourcePath.startsWith(this.vaultPath) ? this.vaultPath : this.projectRoot
    return relative(root, sourcePath)
      .replace(extname(sourcePath), '')
      .replaceAll(sep, '/')
      .toLowerCase()
  }

  private readHeading(source: string): string | undefined {
    return source.match(/^#\s+(.+)$/m)?.[1]?.trim()
  }

  private toTitle(slug: string): string {
    return (
      slug
        .split('/')
        .at(-1)
        ?.replaceAll('-', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase()) ?? 'Untitled'
    )
  }
}

export class DocsDocumentConflictError extends Error {
  public constructor() {
    super('This document changed after the editor opened it.')
  }
}
