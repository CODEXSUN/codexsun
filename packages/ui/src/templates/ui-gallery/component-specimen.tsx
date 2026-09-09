import type { UiComponentDoc } from './ui-components'
import type { UiComponentVariantId } from './component-variants'
import { ActionsSpecimen } from './component-specimen-actions'
import { DataSpecimen } from './component-specimen-data'
import { FormsSpecimen } from './component-specimen-forms'
import { NavigationSpecimen } from './component-specimen-navigation'
import { OverlaysSpecimen } from './component-specimen-overlays'

export function ComponentSpecimen({
  compact = false,
  component,
  variant,
}: {
  compact?: boolean
  component: UiComponentDoc
  variant: UiComponentVariantId
}) {
  const props = { componentId: component.id, compact }

  if (component.category === 'Forms') return <FormsSpecimen {...props} />
  if (component.category === 'Overlays') return <OverlaysSpecimen {...props} />
  if (component.category === 'Navigation') {
    return <NavigationSpecimen {...props} variant={variant} />
  }
  if (component.category === 'Data display' || component.category === 'Layout') {
    return <DataSpecimen {...props} />
  }
  return <ActionsSpecimen {...props} />
}
