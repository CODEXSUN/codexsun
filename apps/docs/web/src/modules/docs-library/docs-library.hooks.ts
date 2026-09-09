import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDocument, fetchDocuments, updateDocument } from './docs-library.services'
import type { DocsState } from './docs-library.types'

const initialState: DocsState = { documents: [], loading: true }

export function useDocsLibrary() {
  const [state, setState] = useState<DocsState>(initialState)
  const [selectedSlug, setSelectedSlug] = useState(readSlugFromLocation)
  const documentCache = useRef(new Map<string, DocsState['activeDocument']>())

  useEffect(() => {
    const controller = new AbortController()
    void fetchDocuments(controller.signal)
      .then(({ documents }) => {
        setState((current) => ({
          ...current,
          documents,
          loading: selectedSlug ? current.loading : false,
        }))
      })
      .catch(
        (error: unknown) =>
          !isAbortError(error) &&
          setState({ documents: [], error: toMessage(error), loading: false }),
      )
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedSlug) {
      setState((current) => ({
        ...current,
        activeDocument: undefined,
        error: undefined,
        loading: false,
      }))
      return
    }

    const cached = documentCache.current.get(selectedSlug)
    if (cached) {
      setState((current) => ({
        ...current,
        activeDocument: cached,
        error: undefined,
        loading: false,
      }))
      return
    }

    const controller = new AbortController()
    setState((current) => ({ ...current, error: undefined, loading: true }))
    void fetchDocument(selectedSlug, controller.signal)
      .then((activeDocument) => {
        documentCache.current.set(selectedSlug, activeDocument)
        setState((current) => ({ ...current, activeDocument, loading: false }))
      })
      .catch(
        (error: unknown) =>
          !isAbortError(error) &&
          setState((current) => ({ ...current, error: toMessage(error), loading: false })),
      )
    return () => controller.abort()
  }, [selectedSlug])

  useEffect(() => {
    const onHashChange = () => setSelectedSlug(readSlugFromLocation())
    onHashChange()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const selectDocument = useCallback((slug?: string) => {
    if (slug) {
      window.location.hash = slug
    } else {
      window.history.pushState(null, '', window.location.pathname)
      setSelectedSlug(undefined)
    }
  }, [])

  const saveDocument = useCallback(
    async (slug: string, input: { source: string; sourceHash: string; title?: string }) => {
      const document = await updateDocument(slug, input)
      documentCache.current.set(slug, document)
      setState((current) => ({
        ...current,
        activeDocument: current.activeDocument?.slug === slug ? document : current.activeDocument,
        documents: current.documents.map((item) =>
          item.slug === slug
            ? {
                ...item,
                description: document.description,
                title: document.title,
                updatedAt: document.updatedAt,
              }
            : item,
        ),
      }))
      return document
    },
    [],
  )

  return { ...state, saveDocument, selectDocument }
}

function readSlugFromLocation(): string | undefined {
  const slug = decodeURIComponent(window.location.hash.slice(1))
  return /^[a-z0-9/-]+$/.test(slug) ? slug : undefined
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Docs is unavailable.'
}
