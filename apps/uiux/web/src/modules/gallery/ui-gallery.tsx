import { findUiBlock } from './ui-blocks'
import { UiComponentDisplayPage } from './ui-component-display-page'
import { findUiComponent } from './ui-components'
import { UiFormDocumentation } from './ui-form-doc'
import { UiLayoutDocumentation } from './ui-layout-doc'
import { findUiLayout } from './ui-layouts'
import { UiOverview } from './ui-overview'
import { UiPageDocumentation } from './ui-page-doc'
import { findUiPage } from './ui-pages'
import { UiTableDocumentation } from './ui-table-doc'

export function UiGallery() {
  const search = new URLSearchParams(window.location.search)
  const layout = findUiLayout(search.get('layout'))
  const page = findUiPage(search.get('page'))
  const requestedComponent = search.get('component')
  const block = findUiBlock(
    search.get('block') ?? (requestedComponent === 'table' ? 'table' : null),
  )
  const component = findUiComponent(requestedComponent)
  if (block?.id === 'table') return <UiTableDocumentation />
  if (block?.id === 'form') return <UiFormDocumentation />
  if (component) return <UiComponentDisplayPage component={component} />
  if (page) return <UiPageDocumentation page={page} />
  return layout ? <UiLayoutDocumentation layout={layout} /> : <UiOverview />
}
