import type { UiComponentDoc } from './ui-components'

export type UiComponentVariantId = 'boxed' | 'default'

export type UiComponentVariant = {
  description: string
  id: UiComponentVariantId
  name: string
}

const defaultVariant: UiComponentVariant = {
  description: 'The standard application-ready component composition.',
  id: 'default',
  name: 'Default',
}

const borderlessVariant: UiComponentVariant = {
  description: 'A borderless accordion with row dividers.',
  id: 'default',
  name: 'Borderless',
}

const boxedVariant: UiComponentVariant = {
  description: 'A connected accordion with a boxed outer edge.',
  id: 'boxed',
  name: 'Boxed',
}

const defaultVariants: readonly UiComponentVariant[] = [defaultVariant]
const accordionVariants: readonly UiComponentVariant[] = [borderlessVariant, boxedVariant]
const buttonVariants: readonly UiComponentVariant[] = [
  {
    description: 'The complete standard Button set in a responsive three-row grid.',
    id: 'default',
    name: 'Default Version',
  },
]
const buttonGroupVariants: readonly UiComponentVariant[] = [
  {
    description: 'The complete standard Button Group set in a responsive three-row grid.',
    id: 'default',
    name: 'Default Version',
  },
]

export const uiComponentDefaultVariant: UiComponentVariantId = 'default'

export function getUiComponentVariants(component: UiComponentDoc) {
  if (component.id === 'accordion') return accordionVariants
  if (component.id === 'button') return buttonVariants
  if (component.id === 'button-group') return buttonGroupVariants
  return defaultVariants
}

export function resolveUiComponentVariant(
  component: UiComponentDoc,
  variantId: string | null,
  defaultVariantId: UiComponentVariantId = uiComponentDefaultVariant,
): UiComponentVariant {
  return (
    getUiComponentVariants(component).find(({ id }) => id === variantId) ??
    getUiComponentVariants(component).find(({ id }) => id === defaultVariantId) ??
    defaultVariant
  )
}
