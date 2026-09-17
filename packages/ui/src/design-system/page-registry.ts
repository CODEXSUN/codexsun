import type { DesignSystemPageDefinition } from './contracts'

export const designSystemPages: readonly DesignSystemPageDefinition[] = [
  {
    defaultVariantId: 'v1',
    description: 'A presentation-only sign-in page with application-owned authentication.',
    id: 'login',
    name: 'Login',
    source: '@codexsun/ui/blocks/auth',
    variants: [
      {
        description: 'Centered CODEXSUN sign-in card for focused application entry.',
        id: 'v1',
        name: 'Login v1',
      },
      {
        description: 'Split sign-in card with provider actions and a supporting visual panel.',
        id: 'v2',
        name: 'Login v2',
      },
    ],
  },
  {
    defaultVariantId: 'v1',
    description: 'A presentation-only account registration page.',
    id: 'register',
    name: 'Register',
    source: '@codexsun/ui/blocks/auth',
    variants: [
      {
        description: 'Centered registration card for the standard account flow.',
        id: 'v1',
        name: 'Register v1',
      },
      {
        description: 'Split registration page with workspace onboarding context.',
        id: 'v2',
        name: 'Register v2',
      },
    ],
  },
  {
    defaultVariantId: 'default',
    description: 'A focused account-recovery page that does not disclose account existence.',
    id: 'forgot-password',
    name: 'Forgot Password',
    source: '@codexsun/ui/blocks/auth',
    variants: [
      {
        description: 'The package-owned account recovery page.',
        id: 'default',
        name: 'Forgot Password',
      },
    ],
  },
  {
    defaultVariantId: 'default',
    description: 'A full-page notification inbox with application-owned records and actions.',
    id: 'notifications',
    name: 'Notifications Page',
    source: '@codexsun/ui/blocks/notifications',
    variants: [
      {
        description: 'The package-owned notification inbox page.',
        id: 'default',
        name: 'Notifications Page',
      },
    ],
  },
]

export function getDesignSystemPage(pageId: string) {
  return designSystemPages.find(({ id }) => id === pageId)
}
