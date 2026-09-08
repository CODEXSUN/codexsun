import type { Document, DocumentSummary } from '@codexsun/docs-contracts'

export type DocumentRecord = DocumentSummary & {
  source: string
  sourceHash: string
}

export type RenderedDocument = Document
