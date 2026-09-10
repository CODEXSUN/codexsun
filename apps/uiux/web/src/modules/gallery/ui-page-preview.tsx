import { LoginPage, PasswordForgotPage, RegisterPage } from '@codexsun/ui/blocks/auth'
import { NotificationCenterPage } from '@codexsun/ui/blocks/notifications'
import type { UiPageDoc } from './ui-pages'

const notificationItems = [
  {
    description: 'The Platform production build completed and is ready for review.',
    id: 'build-ready',
    time: '2 min',
    title: 'Build ready',
  },
  {
    description: 'Ashok assigned the workspace access review to your team.',
    id: 'access-review',
    time: '18 min',
    title: 'Access review assigned',
  },
  {
    description: 'The Agent Workspace design-system default was updated.',
    id: 'design-system',
    read: true,
    time: 'Yesterday',
    title: 'Design system updated',
  },
] as const

export function UiPagePreview({ page }: { page: UiPageDoc }) {
  if (page.family.id === 'login') {
    return (
      <LoginPage
        embedded
        onSubmit={() => undefined}
        variant={page.variantId === 'v2' ? 'v2' : 'v1'}
      />
    )
  }
  if (page.family.id === 'register') {
    return (
      <RegisterPage
        embedded
        onSubmit={() => undefined}
        variant={page.variantId === 'v2' ? 'v2' : 'v1'}
      />
    )
  }
  if (page.family.id === 'forgot-password') {
    return <PasswordForgotPage backHref="/?page=login-v1" embedded onSubmit={() => undefined} />
  }
  return <NotificationCenterPage embedded items={notificationItems} />
}
