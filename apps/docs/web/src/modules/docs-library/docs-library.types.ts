import type { Document, DocumentSummary } from '@codexsun/docs-contracts'

export type DocsState = {
  activeDocument?: Document
  documents: DocumentSummary[]
  error?: string
  loading: boolean
}
