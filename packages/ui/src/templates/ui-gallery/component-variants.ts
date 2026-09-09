import type { UiComponentDoc } from './ui-components'

export type UiComponentVariantId =
  | 'boxed'
  | 'default'
  | 'destructive'
  | 'ghost'
  | 'icon'
  | 'icon-text'
  | 'info'
  | 'link'
  | 'loading'
  | 'neutral'
  | 'outline'
  | 'secondary'
  | 'split'
  | 'success'
  | 'warning'

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
  { description: 'The main action for a page or task.', id: 'default', name: 'Primary' },
  { description: 'A strong action without theme emphasis.', id: 'neutral', name: 'Neutral' },
  { description: 'A lower-emphasis filled action.', id: 'secondary', name: 'Secondary' },
  { description: 'A positive or completion action.', id: 'success', name: 'Success' },
  { description: 'An action that needs caution.', id: 'warning', name: 'Warning' },
  { description: 'An informational action.', id: 'info', name: 'Info' },
  { description: 'A destructive or irreversible action.', id: 'destructive', name: 'Destructive' },
  { description: 'A bordered action on the page surface.', id: 'outline', name: 'Outline' },
  { description: 'A quiet action that appears on interaction.', id: 'ghost', name: 'Ghost' },
  { description: 'A navigation action styled as a link.', id: 'link', name: 'Link' },
  { description: 'A square icon-only action with an accessible label.', id: 'icon', name: 'Icon' },
  { description: 'A text action with a leading icon.', id: 'icon-text', name: 'Icon with text' },
  { description: 'A disabled action that reports progress.', id: 'loading', name: 'Loading' },
  { description: 'A main action paired with a related menu.', id: 'split', name: 'Split' },
]

export const uiComponentDefaultVariant: UiComponentVariantId = 'default'

export function getUiComponentVariants(component: UiComponentDoc) {
  if (component.id === 'accordion') return accordionVariants
  if (component.id === 'button') return buttonVariants
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
