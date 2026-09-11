import { lazy, Suspense } from 'react'
import { findUiBlock } from './ui-blocks'
import { findUiComponent } from './ui-components'
import { findUiLayout } from './ui-layouts'
import { findUiPage } from './ui-pages'

const UiExecutionStatusDocumentation = lazy(() =>
  import('./ui-execution-status-doc').then((m) => ({ default: m.UiExecutionStatusDocumentation })),
)
const UiComponentDisplayPage = lazy(() =>
  import('./ui-component-display-page').then((m) => ({ default: m.UiComponentDisplayPage })),
)
const UiFormDocumentation = lazy(() =>
  import('./ui-form-doc').then((m) => ({ default: m.UiFormDocumentation })),
)
const UiLayoutDocumentation = lazy(() =>
  import('./ui-layout-doc').then((m) => ({ default: m.UiLayoutDocumentation })),
)
const UiOverview = lazy(() =>
  import('./ui-overview').then((m) => ({ default: m.UiOverview })),
)
const UiPageDocumentation = lazy(() =>
  import('./ui-page-doc').then((m) => ({ default: m.UiPageDocumentation })),
)
const UiTableDocumentation = lazy(() =>
  import('./ui-table-doc').then((m) => ({ default: m.UiTableDocumentation })),
)
const UiKanbanDocumentation = lazy(() =>
  import('./ui-kanban-doc').then((m) => ({ default: m.UiKanbanDocumentation })),
)
const UiFileTreeDocumentation = lazy(() =>
  import('./ui-file-tree-doc').then((m) => ({ default: m.UiFileTreeDocumentation })),
)
const UiDropzoneDocumentation = lazy(() =>
  import('./ui-dropzone-doc').then((m) => ({ default: m.UiDropzoneDocumentation })),
)
const UiFilterBuilderDocumentation = lazy(() =>
  import('./ui-filter-builder-doc').then((m) => ({ default: m.UiFilterBuilderDocumentation })),
)
const UiSiteHeaderDocumentation = lazy(() =>
  import('./ui-site-header-doc').then((m) => ({ default: m.UiSiteHeaderDocumentation })),
)
const UiProductCardDocumentation = lazy(() =>
  import('./ui-product-card-doc').then((m) => ({ default: m.UiProductCardDocumentation })),
)
const UiPricingDocumentation = lazy(() =>
  import('./ui-pricing-doc').then((m) => ({ default: m.UiPricingDocumentation })),
)

function GalleryLoadingFallback() {
  return (
    <div
      aria-label="Loading gallery page"
      className="flex min-h-96 w-full items-center justify-center"
      role="status"
    >
      <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export function UiGallery() {
  const search = new URLSearchParams(window.location.search)
  const layout = findUiLayout(search.get('layout'))
  const page = findUiPage(search.get('page'))
  const requestedComponent = search.get('component')
  const block = findUiBlock(
    search.get('block') ?? (requestedComponent === 'table' ? 'table' : null),
  )
  const component = findUiComponent(requestedComponent)

  function renderContent() {
    if (layout?.id === 'site-header') return <UiSiteHeaderDocumentation />
    if (block?.id === 'table') return <UiTableDocumentation />
    if (block?.id === 'form') return <UiFormDocumentation />
    if (block?.id === 'execution-status') return <UiExecutionStatusDocumentation />
    if (block?.id === 'kanban') return <UiKanbanDocumentation />
    if (block?.id === 'file-tree') return <UiFileTreeDocumentation />
    if (block?.id === 'dropzone') return <UiDropzoneDocumentation />
    if (block?.id === 'filter-builder') return <UiFilterBuilderDocumentation />
    if (block?.id === 'product-card') return <UiProductCardDocumentation />
    if (block?.id === 'pricing') return <UiPricingDocumentation />
    if (component) return <UiComponentDisplayPage component={component} />
    if (page) return <UiPageDocumentation page={page} />
    return layout ? <UiLayoutDocumentation layout={layout} /> : <UiOverview />
  }

  return <Suspense fallback={<GalleryLoadingFallback />}>{renderContent()}</Suspense>
}
