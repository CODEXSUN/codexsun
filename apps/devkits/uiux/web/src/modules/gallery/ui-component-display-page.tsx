import { useEffect, useState } from 'react'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'
import { createComponentCode } from './component-code'
import { ComponentVariantGallery } from './component-variant-gallery'
import {
  getUiComponentVariants,
  resolveUiComponentVariant,
  uiComponentDefaultVariant,
  type UiComponentVariantId,
} from './component-variants'
import { uiComponentDocs, type UiComponentDoc } from './ui-components'

export type UiComponentDisplayPageProps = {
  component: UiComponentDoc
}

export function UiComponentDisplayPage({ component }: UiComponentDisplayPageProps) {
  const topology = useMdiTopology()
  const [defaultVariantId, setDefaultVariantId] = useState<UiComponentVariantId>(() =>
    readDefaultVariant(component),
  )
  const variants = getUiComponentVariants(component)
  const componentIndex = uiComponentDocs.findIndex(({ id }) => id === component.id)
  const previous = uiComponentDocs[componentIndex - 1]
  const next = uiComponentDocs[componentIndex + 1]

  useEffect(() => {
    setDefaultVariantId(readDefaultVariant(component))
  }, [component])

  function setDefaultVariant(variant: UiComponentVariantId) {
    setDefaultVariantId(variant)
    window.localStorage.setItem(createDefaultVariantStorageKey(component), variant)
  }

  return (
    <UiTemplatePage
      code={createComponentCode(component, defaultVariantId)}
      importPath={component.source}
      kind="Component"
      name={component.name}
      navigation={{
        previous: previous
          ? { href: `/?component=${previous.id}`, name: previous.name }
          : { href: '/?block=form', name: 'Form' },
        next: next
          ? { href: `/?component=${next.id}`, name: next.name }
          : { href: '/', name: 'UI overview' },
      }}
      preview={
        <ComponentVariantGallery
          component={component}
          defaultVariantId={defaultVariantId}
          onDefaultVariantChange={setDefaultVariant}
          variants={variants}
        />
      }
      showCode={false}
      topology={topology}
      topologyIds={{ page: '24', preview: '24.1', usage: '24.2' }}
      usageDescription={
        <p>
          Review each live {component.name} variant. Copy a variant or open its complete code from
          the card header. Blocks use the selected default.
        </p>
      }
      usageTitle={`${component.name} usage`}
    />
  )
}

function readDefaultVariant(component: UiComponentDoc) {
  if (typeof window === 'undefined') return uiComponentDefaultVariant
  const stored = window.localStorage.getItem(createDefaultVariantStorageKey(component))
  return resolveUiComponentVariant(component, stored).id
}

function createDefaultVariantStorageKey(component: UiComponentDoc) {
  return `codexsun.ui.component-default.${component.id}`
}
