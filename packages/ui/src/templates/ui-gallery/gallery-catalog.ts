export type GalleryComponent = {
  category: GalleryCategory
  name: string
  source: string
}

export type GalleryCategory =
  | 'Actions'
  | 'Communication'
  | 'Data display'
  | 'Feedback'
  | 'Forms'
  | 'Layout'
  | 'Navigation'
  | 'Overlays'

const entries: Record<GalleryCategory, string[]> = {
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

export const galleryCategories = Object.keys(entries) as GalleryCategory[]

export const galleryComponents: GalleryComponent[] = galleryCategories.flatMap((category) =>
  entries[category].map((name) => ({ category, name, source: toSource(name) })),
)

function toSource(name: string) {
  return `@codexsun/ui/components/${name.toLowerCase().replaceAll(' ', '-')}`
}
