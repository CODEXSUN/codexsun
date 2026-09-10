import type {
  DesignSystemCategory,
  DesignSystemComponentDefinition,
  DesignSystemVariantDefinition,
} from './contracts'
import { buttonDefaultVariant, buttonGroupDefaultOrientation } from './defaults'

const defaultVariant: DesignSystemVariantDefinition = {
  description: 'The package-owned application default.',
  id: 'default',
  name: 'Default',
}

const componentNames: Record<DesignSystemCategory, readonly string[]> = {
  Actions: ['Button', 'Button Group', 'Toggle', 'Toggle Group'],
  Communication: ['Attachment', 'Bubble', 'Message', 'Message Scroller'],
  'Data display': [
    'Avatar',
    'Badge',
    'Calendar',
    'Card',
    'Carousel',
    'Chart',
    'Item',
    'Kbd',
    'Marker',
    'Table',
  ],
  Feedback: ['Alert', 'Empty', 'Progress', 'Skeleton', 'Sonner', 'Spinner', 'Toast'],
  Forms: [
    'Checkbox',
    'Combobox',
    'Field',
    'Input',
    'Input Group',
    'Input OTP',
    'Label',
    'Native Select',
    'Questionnaire',
    'Radio Group',
    'Select',
    'Slider',
    'Switch',
    'Textarea',
  ],
  Layout: ['Aspect Ratio', 'Collapsible', 'Direction', 'Resizable', 'Scroll Area', 'Separator'],
  Navigation: [
    'Accordion',
    'Breadcrumb',
    'Menubar',
    'Navigation Menu',
    'Pagination',
    'Sidebar',
    'Tabs',
  ],
  Overlays: [
    'Alert Dialog',
    'Command',
    'Context Menu',
    'Dialog',
    'Drawer',
    'Dropdown Menu',
    'Hover Card',
    'Popover',
    'Sheet',
    'Tooltip',
  ],
}

const componentVariants: Readonly<Record<string, readonly DesignSystemVariantDefinition[]>> = {
  sidebar: [
    defaultVariant,
    { id: 'outline', name: 'Outline', description: 'A bordered sidebar menu button.' },
    {
      id: 'accented',
      name: 'Accented',
      description:
        'A left-aligned sidebar menu button with a selected accent marker. Supports comfortable 40px rows.',
    },
  ],
  accordion: [
    {
      description: 'The standard borderless disclosure list.',
      id: 'default',
      name: 'Borderless',
    },
    {
      description: 'A connected disclosure list with an outer border.',
      id: 'boxed',
      name: 'Boxed',
    },
  ],
  alert: [
    { description: 'A neutral application notice.', id: 'default', name: 'Default' },
    {
      description: 'A destructive or failed-state notice.',
      id: 'destructive',
      name: 'Destructive',
    },
  ],
  button: [
    { description: 'The main action on a surface.', id: 'default', name: 'Primary' },
    { description: 'A strong action without theme emphasis.', id: 'neutral', name: 'Neutral' },
    { description: 'An alternative action.', id: 'secondary', name: 'Secondary' },
    { description: 'A successful completion action.', id: 'success', name: 'Success' },
    { description: 'An action that needs review.', id: 'warning', name: 'Warning' },
    { description: 'An informational action.', id: 'info', name: 'Information' },
    { description: 'An irreversible action.', id: 'destructive', name: 'Destructive' },
    { description: 'A bordered surface action.', id: 'outline', name: 'Outline' },
    { description: 'A quiet contextual action.', id: 'ghost', name: 'Ghost' },
    { description: 'A navigation action.', id: 'link', name: 'Link' },
  ],
  'button-group': [
    {
      description: 'A connected horizontal action group.',
      id: buttonGroupDefaultOrientation,
      name: 'Horizontal',
    },
    { description: 'A connected vertical action group.', id: 'vertical', name: 'Vertical' },
  ],
}

export const designSystemCategories = Object.keys(componentNames) as DesignSystemCategory[]

export const designSystemComponents: readonly DesignSystemComponentDefinition[] =
  designSystemCategories.flatMap((category) =>
    componentNames[category].map((name) => createComponentDefinition(category, name)),
  )

export function getDesignSystemComponent(componentId: string) {
  return designSystemComponents.find(({ id }) => id === componentId)
}

function createComponentDefinition(
  category: DesignSystemCategory,
  name: string,
): DesignSystemComponentDefinition {
  const id = toId(name)
  return {
    category,
    defaultVariantId: resolveDefaultVariantId(id),
    id,
    name,
    source: `@codexsun/ui/components/${id}`,
    variants: componentVariants[id] ?? [defaultVariant],
  }
}

function resolveDefaultVariantId(componentId: string) {
  if (componentId === 'button') return buttonDefaultVariant
  if (componentId === 'button-group') return buttonGroupDefaultOrientation
  return 'default'
}

function toId(name: string) {
  return name.toLowerCase().replaceAll(' ', '-')
}
