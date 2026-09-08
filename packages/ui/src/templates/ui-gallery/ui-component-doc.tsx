import { useMdiTopology } from '../../layouts/mdi-main'
import { UiTemplatePage } from '../ui-page'
import { GalleryData } from './gallery-data'
import { GalleryForms } from './gallery-forms'
import { GalleryFoundations } from './gallery-foundations'
import { GalleryOverlays } from './gallery-overlays'
import { uiComponentDocs, type UiComponentDoc } from './ui-components'

export function UiComponentDocumentation({ component }: { component: UiComponentDoc }) {
  const topology = useMdiTopology()
  const componentIndex = uiComponentDocs.findIndex(({ id }) => id === component.id)
  const previous = uiComponentDocs[componentIndex - 1]
  const next = uiComponentDocs[componentIndex + 1]

  return (
    <UiTemplatePage
      code={createComponentCode(component)}
      importPath={component.source}
      kind="Component"
      name={component.name}
      navigation={{
        previous: previous
          ? { href: `/ui?component=${previous.id}`, name: previous.name }
          : { href: '/ui?block=form', name: 'Form' },
        next: next
          ? { href: `/ui?component=${next.id}`, name: next.name }
          : { href: '/ui', name: 'UI overview' },
      }}
      preview={<ComponentPreview component={component} />}
      topology={topology}
      topologyIds={{ page: '24', preview: '24.1', usage: '24.2' }}
      usageDescription={
        <p>
          Import {component.name} from its public package path. The live specimen uses the same
          shared primitive and design tokens that applications receive.
        </p>
      }
    />
  )
}

function ComponentPreview({ component }: { component: UiComponentDoc }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/35 px-4 py-3">
        <div>
          <p className="font-medium">{component.name}</p>
          <p className="text-sm text-muted-foreground">
            Live {component.category.toLowerCase()} specimen
          </p>
        </div>
        <code className="rounded-md bg-background px-2.5 py-1 text-xs">{component.source}</code>
      </div>
      {renderCategoryPreview(component.category)}
    </div>
  )
}

function renderCategoryPreview(category: UiComponentDoc['category']) {
  if (category === 'Forms') return <GalleryForms />
  if (category === 'Overlays') return <GalleryOverlays />
  if (category === 'Data display' || category === 'Layout') return <GalleryData />
  return <GalleryFoundations />
}

function createComponentCode(component: UiComponentDoc) {
  const namespace = `${component.name.replaceAll(' ', '')}Ui`
  return `import * as ${namespace} from '${component.source}'

export { ${namespace} }`
}
