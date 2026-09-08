import { findUiBlock } from './ui-blocks'
import { UiComponentDocumentation } from './ui-component-doc'
import { findUiComponent } from './ui-components'
import { UiFormDocumentation } from './ui-form-doc'
import { UiLayoutDocumentation } from './ui-layout-doc'
import { findUiLayout } from './ui-layouts'
import { UiOverview } from './ui-overview'
import { UiTableDocumentation } from './ui-table-doc'

export const uiGalleryTopologySections = [
  {
    id: '20',
    technicalName: 'ui.overview.showcase',
    name: 'UI overview',
    scope: 'UI workspace',
    description: 'Introduces the shared design system through reusable component compositions.',
  },
  {
    id: '21',
    technicalName: 'ui.layouts.documentation',
    name: 'Layout documentation',
    scope: 'UI workspace',
    description: 'Documents one shared layout with preview, usage, code, and ownership guidance.',
  },
  {
    id: '21.1',
    technicalName: 'ui.layouts.preview',
    name: 'Layout preview',
    scope: 'Layout documentation',
    description: 'Shows a scaled visual composition of the selected layout.',
  },
  {
    id: '21.2',
    technicalName: 'ui.layouts.usage',
    name: 'Layout usage',
    scope: 'Layout documentation',
    description: 'Explains the shared and application ownership boundary.',
  },
  {
    id: '21.3',
    technicalName: 'ui.layouts.code',
    name: 'Layout code',
    scope: 'Layout documentation',
    description: 'Provides a copyable TypeScript starting point.',
  },
  {
    id: '22',
    technicalName: 'ui.blocks.tableDocumentation',
    name: 'Table block documentation',
    scope: 'UI workspace',
    description: 'Documents a shared component with its live result and public usage.',
  },
  {
    id: '22.1',
    technicalName: 'ui.table.livePreview',
    name: 'Live table',
    scope: 'Table block documentation',
    description: 'Renders ten sample records through the centralized table block.',
  },
  {
    id: '22.2',
    technicalName: 'ui.table.usageCode',
    name: 'Table usage code',
    scope: 'Table block documentation',
    description: 'Provides a copyable table composition example.',
  },
  {
    id: '23',
    technicalName: 'ui.blocks.formDocumentation',
    name: 'Form block documentation',
    scope: 'UI workspace',
    description: 'Documents the shared form composition and application-owned field content.',
  },
  {
    id: '23.1',
    technicalName: 'ui.form.livePreview',
    name: 'Live form',
    scope: 'Form block documentation',
    description: 'Renders tabs, lookup fields, active state, and form actions.',
  },
  {
    id: '23.2',
    technicalName: 'ui.form.usageCode',
    name: 'Form usage code',
    scope: 'Form block documentation',
    description: 'Provides a copyable form composition example.',
  },
  {
    id: '24',
    technicalName: 'ui.components.documentation',
    name: 'Component documentation',
    scope: 'UI workspace',
    description: 'Documents every shared primitive through the standard live page pattern.',
  },
  {
    id: '24.1',
    technicalName: 'ui.components.livePreview',
    name: 'Live component preview',
    scope: 'Component documentation',
    description: 'Renders a live package-owned specimen for the selected component category.',
  },
  {
    id: '24.2',
    technicalName: 'ui.components.usageCode',
    name: 'Component usage code',
    scope: 'Component documentation',
    description: 'Provides the selected component public import path.',
  },
] as const

export function UiGallery() {
  const search = new URLSearchParams(window.location.search)
  const layout = findUiLayout(search.get('layout'))
  const requestedComponent = search.get('component')
  const block = findUiBlock(
    search.get('block') ?? (requestedComponent === 'table' ? 'table' : null),
  )
  const component = findUiComponent(requestedComponent)
  if (block?.id === 'table') return <UiTableDocumentation />
  if (block?.id === 'form') return <UiFormDocumentation />
  if (component) return <UiComponentDocumentation component={component} />
  return layout ? <UiLayoutDocumentation layout={layout} /> : <UiOverview />
}
