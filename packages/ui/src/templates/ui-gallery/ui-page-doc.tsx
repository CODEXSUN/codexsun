import { useEffect, useState } from 'react'
import { useMdiTopology } from '../../layouts/mdi-main'
import { UiTemplatePage } from '../ui-page'
import { createUiPageCode } from './ui-page-code'
import { UiPageVariantCard } from './ui-page-variant-card'
import { uiPageDocs, type UiPageDoc } from './ui-pages'

export function UiPageDocumentation({ page }: { page: UiPageDoc }) {
  const topology = useMdiTopology()
  const [defaultVariantId, setDefaultVariantId] = useState(() => readDefaultVariant(page))
  const index = uiPageDocs.findIndex(({ id }) => id === page.id)
  const previous = uiPageDocs[index - 1]
  const next = uiPageDocs[index + 1]

  useEffect(() => setDefaultVariantId(readDefaultVariant(page)), [page])

  function setDefault() {
    setDefaultVariantId(page.variantId)
    window.localStorage.setItem(storageKey(page), page.variantId)
  }

  return (
    <UiTemplatePage
      code={createUiPageCode(page)}
      importPath={page.family.source}
      kind="Page"
      name={page.name}
      navigation={{
        previous: previous
          ? { href: `/ui?page=${previous.id}`, name: previous.name }
          : { href: '/ui?layout=agent-workspace', name: 'Agent Workspace' },
        next: next
          ? { href: `/ui?page=${next.id}`, name: next.name }
          : { href: '/ui?block=table', name: 'Table' },
      }}
      preview={
        <UiPageVariantCard
          isDefault={page.variantId === defaultVariantId}
          onSetDefault={setDefault}
          page={page}
        />
      }
      showCode={false}
      topology={topology}
      topologyIds={{ page: '25', preview: '25.1', usage: '25.2' }}
      usageDescription={
        <p>
          Connect the public page block to the owning application route, authentication service, or
          notification state. The selected default is resolved programmatically for this page
          family.
        </p>
      }
      usageTitle={`${page.name} usage`}
    />
  )
}

function readDefaultVariant(page: UiPageDoc) {
  if (typeof window === 'undefined') return page.family.defaultVariantId
  const stored = window.localStorage.getItem(storageKey(page))
  return page.family.variants.some(({ id }) => id === stored)
    ? stored!
    : page.family.defaultVariantId
}

function storageKey(page: UiPageDoc) {
  return `codexsun.ui.page-default.${page.family.id}`
}
