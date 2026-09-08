import type { Document, DocumentSummary } from '@codexsun/docs-contracts'

export type DocumentHeading = {
  id: string
  level: 2 | 3
  text: string
}

export function getDocumentHeadings(source: string): DocumentHeading[] {
  return [...source.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((match) => ({
    id: toAnchor(match[2]),
    level: match[1].length as 2 | 3,
    text: match[2].replace(/[`*_]/g, '').trim(),
  }))
}

export function getRelatedDocuments(
  document: Document,
  documents: DocumentSummary[],
): DocumentSummary[] {
  const tags = new Set(document.tags)
  return documents
    .filter((candidate) => candidate.slug !== document.slug)
    .map((candidate) => ({
      candidate,
      score: candidate.tags.filter((tag) => tags.has(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.candidate.title.localeCompare(right.candidate.title),
    )
    .slice(0, 4)
    .map(({ candidate }) => candidate)
}

export function getBacklinks(document: Document, documents: DocumentSummary[]): DocumentSummary[] {
  return documents.filter((candidate) => candidate.links.includes(document.slug))
}

export function matchesDocument(document: DocumentSummary, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return true
  return [
    document.title,
    document.description,
    document.path,
    ...document.tags,
    ...document.aliases,
  ]
    .join(' ')
    .toLocaleLowerCase()
    .includes(normalized)
}

export function toAnchor(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
