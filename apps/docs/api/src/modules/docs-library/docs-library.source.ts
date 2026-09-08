import matter from 'gray-matter'
import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, relative, resolve, sep } from 'node:path'
import type { DocumentRecord } from './docs-library.types.js'

type FrontMatter = {
  aliases?: unknown
  description?: unknown
  tags?: unknown
  title?: unknown
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

  private async collectDocumentPaths(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true })
    const results = await Promise.all(
      entries.map(async (entry) => {
        const path = resolve(directory, entry.name)
        if (entry.isDirectory()) {
          return entry.name === '.obsidian' ? [] : this.collectDocumentPaths(path)
        }

        return ['.md', '.mdx'].includes(extname(entry.name).toLowerCase()) ? [path] : []
      }),
    )

    return results.flat()
  }

  private async collectSourcePaths(): Promise<string[]> {
    const vaultPaths = await this.collectDocumentPaths(this.vaultPath)
    const assistPaths = await this.collectDocumentPaths(resolve(this.projectRoot, 'assist'))
    const readmes = await this.collectReadmes(this.projectRoot)
    return [...new Set([...vaultPaths, ...assistPaths, ...readmes])]
  }

  private async collectReadmes(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true })
    const results = await Promise.all(
      entries.map(async (entry) => {
        const path = resolve(directory, entry.name)
        if (entry.isDirectory()) {
          return ['apps', 'packages'].includes(entry.name) || directory !== this.projectRoot
            ? this.collectReadmes(path)
            : []
        }

        return entry.name.toLowerCase() === 'readme.md' ? [path] : []
      }),
    )

    return results.flat()
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
